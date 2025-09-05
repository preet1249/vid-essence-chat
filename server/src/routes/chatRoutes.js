import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import Chat from '../models/Chat.js';
import Video from '../models/Video.js';
import { AIService } from '../services/aiService.js';

const router = express.Router();
// Delay instantiation of AIService until it's needed
let aiService = null;

// Helper function to get AIService instance
const getAIService = () => {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/chat/start - Start a new chat session for a video
router.post('/start', [
  body('videoId')
    .notEmpty()
    .withMessage('Video ID is required')
    .custom(async (videoId) => {
      // Check if it's a MongoDB ObjectId (processed video) or YouTube video ID
      if (videoId.length === 24) {
        // MongoDB ObjectId format
        const video = await Video.findById(videoId);
        if (!video || video.processingStatus !== 'completed') {
          throw new Error('Video not found or not fully processed');
        }
      } else if (videoId.length === 11) {
        // YouTube video ID format
        const video = await Video.findByVideoId(videoId);
        if (!video || video.processingStatus !== 'completed') {
          throw new Error('Video not found or not fully processed');
        }
      } else {
        throw new Error('Invalid video ID format');
      }
      return true;
    })
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.body;
    
    // Find the video (handle both MongoDB ID and YouTube video ID)
    let video;
    if (videoId.length === 24) {
      video = await Video.findById(videoId);
    } else {
      video = await Video.findByVideoId(videoId);
    }

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Generate unique session ID
    const sessionId = uuidv4();

    // Create new chat session
    const chat = new Chat({
      videoId: video.videoId, // Always use YouTube video ID
      sessionId,
      messages: [],
      isActive: true
    });

    await chat.save();

    res.json({
      success: true,
      message: 'Chat session started',
      data: {
        sessionId,
        videoTitle: video.title,
        videoId: video.videoId
      }
    });

  } catch (error) {
    console.error('Error starting chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start chat session',
      error: error.message
    });
  }
});

// POST /api/chat/message - Send a message in a chat session
router.post('/message', [
  body('sessionId')
    .isUUID(4)
    .withMessage('Valid session ID is required'),
  body('message')
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // Find chat session
    const chat = await Chat.findActiveBySession(sessionId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found or inactive'
      });
    }

    // Find video context
    const video = await Video.findByVideoId(chat.videoId);
    if (!video || video.processingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Video context not available'
      });
    }

    // Add user message to chat
    await chat.addMessage(message, 'user');

    // Prepare video context for AI
    const videoContext = {
      title: video.title,
      channelName: video.channelName,
      summary: video.summary,
      keyPoints: video.keyPoints,
      transcript: video.transcript
    };

    // Get recent chat history (last 10 messages for context)
    const recentMessages = chat.messages.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Generate AI response
    const aiServiceInstance = getAIService();
    const aiResponse = await aiServiceInstance.generateChatResponse(
      message,
      videoContext,
      recentMessages.slice(0, -1) // Exclude the current message
    );

    // Add AI response to chat
    await chat.addMessage(aiResponse, 'assistant');

    // Return the AI response
    res.json({
      success: true,
      data: {
        message: aiResponse,
        sessionId: chat.sessionId,
        messageId: chat.messages[chat.messages.length - 1]._id
      }
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

// GET /api/chat/session/:sessionId - Get chat session with messages
router.get('/session/:sessionId', [
  param('sessionId').isUUID(4).withMessage('Valid session ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chat = await Chat.findActiveBySession(sessionId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Get video info
    const video = await Video.findByVideoId(chat.videoId).select('title channelName thumbnailUrl');

    res.json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        videoInfo: video,
        messages: chat.messages,
        totalMessages: chat.totalMessages,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat session',
      error: error.message
    });
  }
});

// GET /api/chat/video/:videoId/sessions - Get all chat sessions for a video
router.get('/video/:videoId/sessions', [
  param('videoId').notEmpty().withMessage('Video ID is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Handle both MongoDB ID and YouTube video ID
    let youtubeVideoId;
    if (videoId.length === 24) {
      const video = await Video.findById(videoId);
      youtubeVideoId = video?.videoId;
    } else {
      youtubeVideoId = videoId;
    }

    if (!youtubeVideoId) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const sessions = await Chat.findByVideoId(youtubeVideoId)
      .limit(limit)
      .select('sessionId totalMessages lastMessageAt createdAt isActive');

    res.json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('Error getting video chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat sessions',
      error: error.message
    });
  }
});

// PUT /api/chat/session/:sessionId/close - Close/deactivate a chat session
router.put('/session/:sessionId/close', [
  param('sessionId').isUUID(4).withMessage('Valid session ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chat = await Chat.findOne({ sessionId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    chat.isActive = false;
    await chat.save();

    res.json({
      success: true,
      message: 'Chat session closed successfully'
    });

  } catch (error) {
    console.error('Error closing chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close chat session',
      error: error.message
    });
  }
});

// GET /api/chat/sessions - Get all chat sessions with pagination
router.get('/sessions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by active status
    if (req.query.active !== undefined) {
      query.isActive = req.query.active === 'true';
    }

    const sessions = await Chat.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('sessionId videoId totalMessages lastMessageAt createdAt isActive');

    const total = await Chat.countDocuments(query);

    // Populate video titles
    const sessionsWithVideoInfo = await Promise.all(
      sessions.map(async (session) => {
        const video = await Video.findByVideoId(session.videoId)
          .select('title channelName thumbnailUrl');
        
        return {
          ...session.toObject(),
          videoInfo: video
        };
      })
    );

    res.json({
      success: true,
      data: {
        sessions: sessionsWithVideoInfo,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat sessions',
      error: error.message
    });
  }
});

// DELETE /api/chat/session/:sessionId - Delete a chat session
router.delete('/session/:sessionId', [
  param('sessionId').isUUID(4).withMessage('Valid session ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chat = await Chat.findOneAndDelete({ sessionId });
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
      error: error.message
    });
  }
});

export default router;
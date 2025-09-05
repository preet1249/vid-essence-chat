import express from 'express';
import { body, param, validationResult } from 'express-validator';
import Video from '../models/Video.js';
import History from '../models/History.js';
import { YouTubeService } from '../services/youtubeService.js';
import { AIService } from '../services/aiService.js';

const router = express.Router();
const youtubeService = new YouTubeService();
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

// POST /api/videos/analyze - Analyze and summarize a YouTube video
router.post('/analyze', [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL')
    .custom((value) => {
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/;
      if (!youtubeRegex.test(value)) {
        throw new Error('Please provide a valid YouTube URL');
      }
      return true;
    })
], handleValidationErrors, async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log(`📹 Starting video analysis for: ${url}`);
    
    // Extract video ID
    const videoId = youtubeService.extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract video ID from URL'
      });
    }

    // Check if video already exists in database
    let existingVideo = await Video.findByVideoId(videoId);
    if (existingVideo && existingVideo.processingStatus === 'completed') {
      console.log(`📹 Video already processed: ${videoId}`);
      
      // Update history
      await updateVideoHistory(existingVideo);
      
      return res.json({
        success: true,
        message: 'Video already processed',
        data: existingVideo
      });
    }

    // Create or update video record
    if (!existingVideo) {
      existingVideo = new Video({ 
        url, 
        videoId, 
        processingStatus: 'processing',
        title: 'Processing...',
        description: '',
        duration: 0,
        thumbnailUrl: '',
        channelName: '',
        publishedAt: new Date(),
        transcript: '',
        summary: ''
      });
      await existingVideo.save();
    } else {
      existingVideo.processingStatus = 'processing';
      await existingVideo.save();
    }

    // Process video in background (return immediate response)
    processVideoInBackground(existingVideo._id, url);

    res.json({
      success: true,
      message: 'Video processing started',
      data: {
        videoId: existingVideo._id,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('❌ Video analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze video',
      error: error.message
    });
  }
});

// Background processing function
async function processVideoInBackground(videoDocId, url) {
  try {
    console.log(`🔄 Background processing started for video: ${videoDocId}`);
    
    const video = await Video.findById(videoDocId);
    if (!video) {
      console.error('Video document not found');
      return;
    }

    // Step 1: Get video info and transcript
    const videoData = await youtubeService.processVideo(url);
    
    // Step 2: Generate AI summary
    const aiServiceInstance = getAIService();
    const summary = await aiServiceInstance.generateSummary(
      videoData.transcript,
      videoData.title,
      videoData.channelName,
      videoData.duration
    );

    // Step 3: Extract key points
    const keyPoints = await aiServiceInstance.extractKeyPoints(
      videoData.transcript,
      videoData.title
    );

    // Step 4: Generate tags
    const tags = await aiServiceInstance.generateTags(
      videoData.transcript,
      videoData.title,
      videoData.channelName
    );

    // Update video record
    Object.assign(video, {
      ...videoData,
      summary,
      keyPoints,
      tags,
      processingStatus: 'completed'
    });

    await video.save();

    // Add to history
    await updateVideoHistory(video);

    console.log(`✅ Video processing completed: ${video.videoId}`);

  } catch (error) {
    console.error('❌ Background processing error:', error);
    
    // Update video with error status
    try {
      const video = await Video.findById(videoDocId);
      if (video) {
        video.processingStatus = 'failed';
        video.processingError = error.message;
        await video.save();
      }
    } catch (updateError) {
      console.error('Failed to update video error status:', updateError);
    }
  }
}

// Helper function to update video history
async function updateVideoHistory(video) {
  try {
    const existingHistory = await History.findOne({ videoId: video.videoId });
    
    if (existingHistory) {
      await existingHistory.updateAccess();
    } else {
      const historyData = {
        videoId: video.videoId,
        videoTitle: video.title,
        videoUrl: video.url,
        thumbnailUrl: video.thumbnailUrl,
        channelName: video.channelName,
        duration: video.duration,
        summary: video.summary,
        keyPoints: video.keyPoints || [],
        tags: video.tags || []
      };
      
      await History.create(historyData);
    }
  } catch (error) {
    console.error('Error updating history:', error);
  }
}

// GET /api/videos/status/:videoId - Get video processing status
router.get('/status/:videoId', [
  param('videoId').isMongoId().withMessage('Invalid video ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: {
        videoId: video._id,
        status: video.processingStatus,
        error: video.processingError,
        progress: video.processingStatus === 'completed' ? 100 : 
                 video.processingStatus === 'processing' ? 50 : 0
      }
    });

  } catch (error) {
    console.error('Error getting video status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video status',
      error: error.message
    });
  }
});

// GET /api/videos/:videoId - Get complete video data
router.get('/:videoId', [
  param('videoId').isMongoId().withMessage('Invalid video ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video',
      error: error.message
    });
  }
});

// GET /api/videos/youtube/:youtubeVideoId - Get video by YouTube video ID
router.get('/youtube/:youtubeVideoId', [
  param('youtubeVideoId').isLength({ min: 11, max: 11 }).withMessage('Invalid YouTube video ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { youtubeVideoId } = req.params;
    
    const video = await Video.findByVideoId(youtubeVideoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error('Error getting video by YouTube ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video',
      error: error.message
    });
  }
});

// GET /api/videos - Get all videos with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.processingStatus = req.query.status;
    }
    
    // Search by title or channel
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { channelName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-transcript'); // Exclude transcript for list view

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get videos',
      error: error.message
    });
  }
});

// DELETE /api/videos/:videoId - Delete a video
router.delete('/:videoId', [
  param('videoId').isMongoId().withMessage('Invalid video ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Delete from video collection
    await Video.findByIdAndDelete(videoId);
    
    // Delete from history if exists
    await History.findOneAndDelete({ videoId: video.videoId });

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
});

export default router;
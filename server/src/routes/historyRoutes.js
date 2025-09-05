import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import History from '../models/History.js';
import Video from '../models/Video.js';

const router = express.Router();

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

// GET /api/history - Get user's video history with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('bookmarked').optional().isBoolean().withMessage('Bookmarked must be a boolean'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Search filter
    if (req.query.search) {
      query.$or = [
        { videoTitle: { $regex: req.query.search, $options: 'i' } },
        { channelName: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }
    
    // Bookmarked filter
    if (req.query.bookmarked === 'true') {
      query.isBookmarked = true;
    }
    
    // Rating filter
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }
    
    // Sort options
    let sortOption = { lastAccessedAt: -1 }; // Default: most recently accessed
    if (req.query.sort === 'created') {
      sortOption = { createdAt: -1 };
    } else if (req.query.sort === 'title') {
      sortOption = { videoTitle: 1 };
    } else if (req.query.sort === 'channel') {
      sortOption = { channelName: 1 };
    } else if (req.query.sort === 'rating') {
      sortOption = { rating: -1, createdAt: -1 };
    }

    const historyItems = await History.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await History.countDocuments(query);

    res.json({
      success: true,
      data: {
        history: historyItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          search: req.query.search || '',
          bookmarked: req.query.bookmarked === 'true',
          rating: req.query.rating ? parseInt(req.query.rating) : null,
          sort: req.query.sort || 'recent'
        }
      }
    });

  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history',
      error: error.message
    });
  }
});

// GET /api/history/recent - Get recent videos (last 10)
router.get('/recent', async (req, res) => {
  try {
    const recentItems = await History.findRecent(10);

    res.json({
      success: true,
      data: recentItems
    });

  } catch (error) {
    console.error('Error getting recent history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent history',
      error: error.message
    });
  }
});

// GET /api/history/bookmarks - Get bookmarked videos
router.get('/bookmarks', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const bookmarks = await History.findBookmarked()
      .skip(skip)
      .limit(limit);

    const total = await History.countDocuments({ isBookmarked: true });

    res.json({
      success: true,
      data: {
        bookmarks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookmarks',
      error: error.message
    });
  }
});

// GET /api/history/stats - Get history statistics
router.get('/stats', async (req, res) => {
  try {
    const totalVideos = await History.countDocuments();
    const totalBookmarks = await History.countDocuments({ isBookmarked: true });
    const ratedVideos = await History.countDocuments({ rating: { $ne: null } });
    
    // Get rating distribution
    const ratingStats = await History.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get top channels
    const topChannels = await History.aggregate([
      { $group: { _id: '$channelName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await History.countDocuments({
      lastAccessedAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalVideos,
        totalBookmarks,
        ratedVideos,
        recentActivity,
        ratingDistribution: ratingStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topChannels: topChannels.map(channel => ({
          name: channel._id,
          count: channel.count
        }))
      }
    });

  } catch (error) {
    console.error('Error getting history stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history statistics',
      error: error.message
    });
  }
});

// GET /api/history/:videoId - Get specific video from history
router.get('/:videoId', [
  param('videoId').notEmpty().withMessage('Video ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;

    const historyItem = await History.findOne({ videoId });
    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in history'
      });
    }

    // Update access count
    await historyItem.updateAccess();

    res.json({
      success: true,
      data: historyItem
    });

  } catch (error) {
    console.error('Error getting history item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history item',
      error: error.message
    });
  }
});

// PUT /api/history/:videoId/bookmark - Toggle bookmark status
router.put('/:videoId/bookmark', [
  param('videoId').notEmpty().withMessage('Video ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;

    const historyItem = await History.findOne({ videoId });
    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in history'
      });
    }

    await historyItem.toggleBookmark();

    res.json({
      success: true,
      message: `Video ${historyItem.isBookmarked ? 'bookmarked' : 'unbookmarked'} successfully`,
      data: {
        videoId: historyItem.videoId,
        isBookmarked: historyItem.isBookmarked
      }
    });

  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
      error: error.message
    });
  }
});

// PUT /api/history/:videoId/rating - Rate a video
router.put('/:videoId/rating', [
  param('videoId').notEmpty().withMessage('Video ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { rating } = req.body;

    const historyItem = await History.findOne({ videoId });
    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in history'
      });
    }

    historyItem.rating = rating;
    await historyItem.save();

    res.json({
      success: true,
      message: 'Video rated successfully',
      data: {
        videoId: historyItem.videoId,
        rating: historyItem.rating
      }
    });

  } catch (error) {
    console.error('Error rating video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate video',
      error: error.message
    });
  }
});

// PUT /api/history/:videoId/notes - Add or update notes
router.put('/:videoId/notes', [
  param('videoId').notEmpty().withMessage('Video ID is required'),
  body('notes').isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { notes } = req.body;

    const historyItem = await History.findOne({ videoId });
    if (!historyItem) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in history'
      });
    }

    historyItem.notes = notes;
    await historyItem.save();

    res.json({
      success: true,
      message: 'Notes updated successfully',
      data: {
        videoId: historyItem.videoId,
        notes: historyItem.notes
      }
    });

  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notes',
      error: error.message
    });
  }
});

// DELETE /api/history/:videoId - Remove video from history
router.delete('/:videoId', [
  param('videoId').notEmpty().withMessage('Video ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { videoId } = req.params;

    const deletedItem = await History.findOneAndDelete({ videoId });
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in history'
      });
    }

    res.json({
      success: true,
      message: 'Video removed from history successfully'
    });

  } catch (error) {
    console.error('Error deleting history item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove video from history',
      error: error.message
    });
  }
});

// DELETE /api/history - Clear all history
router.delete('/', async (req, res) => {
  try {
    const { confirm } = req.query;
    
    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'To clear all history, add ?confirm=true to the request'
      });
    }

    const result = await History.deleteMany({});

    res.json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} items from history`
    });

  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history',
      error: error.message
    });
  }
});

export default router;
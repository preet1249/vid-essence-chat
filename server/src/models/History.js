import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    index: true
  },
  videoTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  duration: {
    type: Number,
    required: true
  },
  summary: {
    type: String,
    required: true,
    maxlength: 10000
  },
  keyPoints: [{
    type: String,
    maxlength: 1000
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  chatSessionCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  accessCount: {
    type: Number,
    default: 1
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  notes: {
    type: String,
    maxlength: 2000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
historySchema.index({ createdAt: -1 });
historySchema.index({ lastAccessedAt: -1 });
historySchema.index({ videoId: 1 }, { unique: true });
historySchema.index({ channelName: 1 });
historySchema.index({ isBookmarked: 1 });
historySchema.index({ rating: 1 });

// Virtual for formatted duration
historySchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for time since last access
historySchema.virtual('timeSinceAccess').get(function() {
  const now = new Date();
  const diff = now - this.lastAccessedAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to find recent history
historySchema.statics.findRecent = function(limit = 10) {
  return this.find({})
    .sort({ lastAccessedAt: -1 })
    .limit(limit);
};

// Static method to find bookmarked items
historySchema.statics.findBookmarked = function() {
  return this.find({ isBookmarked: true })
    .sort({ createdAt: -1 });
};

// Static method to find by rating
historySchema.statics.findByRating = function(rating) {
  return this.find({ rating })
    .sort({ createdAt: -1 });
};

// Instance method to update access
historySchema.methods.updateAccess = function() {
  this.lastAccessedAt = new Date();
  this.accessCount += 1;
  return this.save();
};

// Instance method to toggle bookmark
historySchema.methods.toggleBookmark = function() {
  this.isBookmarked = !this.isBookmarked;
  return this.save();
};

// Pre-save middleware
historySchema.pre('save', function(next) {
  if (this.isNew) {
    this.lastAccessedAt = new Date();
  }
  next();
});

const History = mongoose.model('History', historySchema);

export default History;
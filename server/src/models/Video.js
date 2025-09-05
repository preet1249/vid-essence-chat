import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/).+/.test(v);
      },
      message: 'Please enter a valid YouTube URL'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  duration: {
    type: Number, // Duration in seconds
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
  publishedAt: {
    type: Date,
    required: true
  },
  transcript: {
    type: String,
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
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String,
    maxlength: 1000
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
videoSchema.index({ createdAt: -1 });
videoSchema.index({ processingStatus: 1 });
videoSchema.index({ channelName: 1 });
videoSchema.index({ 'tags': 1 });

// Virtual for formatted duration
videoSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Static method to find by video ID
videoSchema.statics.findByVideoId = function(videoId) {
  return this.findOne({ videoId });
};

// Instance method to extract video ID from URL
videoSchema.methods.extractVideoId = function() {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = this.url.match(regex);
  return match ? match[1] : null;
};

// Pre-save middleware to extract video ID
videoSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('url')) {
    this.videoId = this.extractVideoId();
  }
  next();
});

const Video = mongoose.model('Video', videoSchema);

export default Video;
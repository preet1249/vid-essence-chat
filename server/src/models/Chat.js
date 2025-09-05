import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
chatSchema.index({ createdAt: -1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ videoId: 1, sessionId: 1 });

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Instance method to add message
chatSchema.methods.addMessage = function(content, role) {
  this.messages.push({ content, role });
  this.totalMessages = this.messages.length;
  this.lastMessageAt = new Date();
  return this.save();
};

// Static method to find active chat by session
chatSchema.statics.findActiveBySession = function(sessionId) {
  return this.findOne({ sessionId, isActive: true });
};

// Static method to find chats by video ID
chatSchema.statics.findByVideoId = function(videoId) {
  return this.find({ videoId }).sort({ lastMessageAt: -1 });
};

// Pre-save middleware to update message count and last message time
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.totalMessages = this.messages.length;
    if (this.messages.length > 0) {
      this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
    }
  }
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
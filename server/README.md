# Vid Essence Chat - Backend API

A professional Node.js backend for YouTube video summarization with AI-powered chat functionality.

## 🚀 Features

- **YouTube Video Processing**: Extract metadata, transcripts, and generate AI summaries
- **OpenRouter Integration**: Uses GPT-4o-mini for intelligent summarization and chat responses
- **MongoDB Storage**: Persistent storage for videos, chat sessions, and user history
- **RESTful API**: Clean, well-documented endpoints
- **Error Handling**: Comprehensive error handling and validation
- **Rate Limiting**: Built-in protection against abuse
- **CORS Support**: Configured for frontend integration
- **Logging**: Structured logging for debugging and monitoring

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- OpenRouter API key for GPT-4o-mini

## 🛠 Installation

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string
   
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=openai/gpt-4o-mini
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start the server:**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Video Processing
- `POST /videos/analyze` - Analyze and summarize a YouTube video
- `GET /videos/status/:videoId` - Get processing status
- `GET /videos/:videoId` - Get complete video data
- `GET /videos/youtube/:youtubeVideoId` - Get video by YouTube ID
- `GET /videos` - Get all videos with pagination
- `DELETE /videos/:videoId` - Delete a video

#### Chat System
- `POST /chat/start` - Start a new chat session
- `POST /chat/message` - Send a message in a chat session
- `GET /chat/session/:sessionId` - Get chat session with messages
- `GET /chat/video/:videoId/sessions` - Get all chat sessions for a video
- `PUT /chat/session/:sessionId/close` - Close a chat session
- `DELETE /chat/session/:sessionId` - Delete a chat session

#### History Management
- `GET /history` - Get user's video history
- `GET /history/recent` - Get recent videos
- `GET /history/bookmarks` - Get bookmarked videos
- `GET /history/stats` - Get history statistics
- `PUT /history/:videoId/bookmark` - Toggle bookmark
- `PUT /history/:videoId/rating` - Rate a video
- `PUT /history/:videoId/notes` - Add/update notes
- `DELETE /history/:videoId` - Remove from history

### Example Requests

#### Analyze a Video
```bash
curl -X POST http://localhost:5000/api/videos/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}'
```

#### Start Chat Session
```bash
curl -X POST http://localhost:5000/api/chat/start \\
  -H "Content-Type: application/json" \\
  -d '{"videoId": "VIDEO_ID"}'
```

#### Send Chat Message
```bash
curl -X POST http://localhost:5000/api/chat/message \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId": "SESSION_ID", "message": "What are the key points?"}'
```

## 🗂 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── middleware/
│   │   └── errorMiddleware.js  # Error handling
│   ├── models/
│   │   ├── Video.js           # Video data model
│   │   ├── Chat.js            # Chat session model
│   │   └── History.js         # User history model
│   ├── routes/
│   │   ├── videoRoutes.js     # Video processing endpoints
│   │   ├── chatRoutes.js      # Chat system endpoints
│   │   └── historyRoutes.js   # History management endpoints
│   ├── services/
│   │   ├── youtubeService.js  # YouTube data extraction
│   │   └── aiService.js       # OpenRouter AI integration
│   ├── utils/
│   │   └── logger.js          # Logging utility
│   └── server.js              # Main server file
├── package.json
├── .env.example
└── README.md
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `OPENROUTER_API_KEY` | OpenRouter API key | Required |
| `OPENROUTER_MODEL` | AI model to use | `openai/gpt-4o-mini` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### MongoDB Collections

- **videos**: Stores video metadata, transcripts, and summaries
- **chats**: Stores chat sessions and messages
- **histories**: Stores user's video history and preferences

## 🚦 API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {
    // Response data
  },
  "error": "Error message (only on failure)"
}
```

## 📝 Logging

The application includes comprehensive logging:

- **Development**: Console output with detailed information
- **Production**: File-based logging in `logs/` directory
- **Request logging**: All HTTP requests are logged
- **Error tracking**: Detailed error information for debugging

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Comprehensive input validation
- **Error Handling**: Safe error responses (no sensitive data leakage)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 📊 Monitoring

The API includes several monitoring endpoints:

- `GET /health` - Health check endpoint
- `GET /api/history/stats` - Usage statistics

## 🚨 Error Handling

The API handles various error scenarios:

- Invalid YouTube URLs
- Video processing failures
- AI service errors
- Database connection issues
- Rate limit exceeded
- Validation errors

All errors are properly logged and return appropriate HTTP status codes.

## 🔄 Background Processing

Video processing is handled asynchronously:

1. Client submits video URL
2. Server returns immediate response with processing status
3. Video is processed in the background
4. Client can poll for status updates
5. Completed videos are stored in database

## 📈 Performance Considerations

- **Async Processing**: Long-running tasks are handled asynchronously
- **Database Indexing**: Optimized database queries with proper indexing
- **Caching**: Response caching for frequently accessed data
- **Compression**: Gzip compression for responses
- **Rate Limiting**: Prevents API abuse

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the React frontend:

- CORS configured for frontend URL
- Real-time status updates for video processing
- Chat system with session management
- History tracking and bookmarks
- Responsive error handling

## 📄 License

MIT License - see LICENSE file for details.
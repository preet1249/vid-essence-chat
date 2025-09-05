# Vid Essence Chat - Complete Setup Guide

A comprehensive setup guide for the YouTube Video Summarization with AI Chat application.

## 🚀 Quick Setup

### Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB Atlas** account - [Sign up here](https://www.mongodb.com/atlas)
3. **OpenRouter API** account - [Sign up here](https://openrouter.ai/)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd vid-essence-chat

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: MongoDB Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (free tier is sufficient)

2. **Get Connection String**
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your database user credentials

3. **Create Database User**
   - Go to Database Access
   - Add a new database user
   - Choose password authentication
   - Give the user read/write access

4. **Configure Network Access**
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allows access from anywhere)
   - For production, use specific IP addresses

### Step 3: OpenRouter API Setup

1. **Create OpenRouter Account**
   - Go to [OpenRouter](https://openrouter.ai/)
   - Sign up for an account
   - Add credits to your account (GPT-4o-mini is very cost-effective)

2. **Get API Key**
   - Go to [API Keys](https://openrouter.ai/keys)
   - Create a new API key
   - Copy the API key (starts with `sk-or-`)

### Step 4: Environment Configuration

#### Backend Environment (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your actual values:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration - REPLACE WITH YOUR ACTUAL CONNECTION STRING
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/vid-essence-chat?retryWrites=true&w=majority

# OpenRouter API Configuration - REPLACE WITH YOUR ACTUAL API KEY  
OPENROUTER_API_KEY=sk-or-your-actual-api-key-here
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Security - GENERATE A SECURE SECRET
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-characters

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Environment (.env)
```bash
# From root directory
cp .env.example .env
```

Edit `.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# App Configuration
VITE_APP_NAME="Vid Essence Chat"
VITE_APP_DESCRIPTION="AI-powered YouTube video summarization with chat"

# Development
VITE_DEV_MODE=true
```

### Step 5: Start the Application

Open **two terminals**:

#### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running in development mode on port 5000
📊 MongoDB Connected: cluster0-shard-00-02.xxxxx.mongodb.net
📱 Frontend URL: http://localhost:5173
🔗 API Base URL: http://localhost:5000/api
```

#### Terminal 2 - Frontend Development Server
```bash
# From root directory
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 6: Test the Application

1. **Open your browser** to http://localhost:5173
2. **Test the API** by visiting http://localhost:5000/health
3. **Analyze a video**:
   - Paste a YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Click "Analyze Video"
   - Wait for processing to complete
   - Try the chat feature

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
**Error**: `MongoDB connection failed`

**Solutions**:
- Check your connection string format
- Ensure username/password are correct
- Verify network access allows your IP
- Make sure the database user has proper permissions

#### 2. OpenRouter API Error
**Error**: `Invalid API key` or `Insufficient credits`

**Solutions**:
- Verify your API key starts with `sk-or-`
- Check your OpenRouter account has credits
- Ensure the API key has proper permissions

#### 3. CORS Errors
**Error**: `CORS policy blocked the request`

**Solutions**:
- Check `FRONTEND_URL` in backend `.env`
- Ensure frontend is running on http://localhost:5173
- Restart both servers after changing environment variables

#### 4. Video Processing Fails
**Error**: `Failed to get video transcript`

**Solutions**:
- Ensure the YouTube video has captions/subtitles
- Try a different YouTube video
- Check if the video is public and available

#### 5. Port Already in Use
**Error**: `Port 5000 is already in use`

**Solutions**:
```bash
# Kill process using port 5000
npx kill-port 5000

# Or change port in server/.env
PORT=5001
```

### Environment Variables Validation

Check your environment setup:

#### Backend Health Check
Visit: http://localhost:5000/health

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-XX...",
  "uptime": 123.456,
  "environment": "development"
}
```

#### Test API Connection
```bash
curl -X POST http://localhost:5000/api/videos/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`

3. **Deploy to Vercel**:
   - Connect your GitHub repo to Vercel
   - Vercel will auto-detect the Vite configuration
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`

### Backend Deployment (Railway/Heroku)

1. **Railway Deployment**:
   - Connect your GitHub repo to Railway
   - Deploy from the `server` folder
   - Add all environment variables from your `.env`
   - Set `NODE_ENV=production`

2. **Heroku Deployment**:
   - Create a Heroku app
   - Set the root directory to `server` in settings
   - Add all environment variables
   - Deploy from GitHub

### Production Environment Variables

Update these for production:

#### Backend (.env)
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
OPENROUTER_API_KEY=your-openrouter-api-key
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## 📊 Usage Examples

### Example YouTube URLs to Test
- **Tech Tutorial**: `https://www.youtube.com/watch?v=Tn6-PIqc4UM`
- **Educational Content**: `https://www.youtube.com/watch?v=kxT8-C1vmd4`
- **Conference Talk**: `https://www.youtube.com/watch?v=8aGhZQkoFbQ`

### API Usage Examples

#### Analyze Video
```javascript
const response = await fetch('http://localhost:5000/api/videos/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=VIDEO_ID'
  })
});
```

#### Start Chat
```javascript
const response = await fetch('http://localhost:5000/api/chat/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoId: 'YOUR_VIDEO_ID'
  })
});
```

## 🎯 Next Steps

Once you have the application running:

1. **Analyze your first video** - Try different types of YouTube content
2. **Test the chat feature** - Ask questions about the video content
3. **Explore the history** - Check out the history page with filters and search
4. **Customize the frontend** - Modify colors, text, or layout in the React components
5. **Extend the backend** - Add new features or endpoints
6. **Deploy to production** - Follow the deployment guides above

## 💬 Support

If you run into issues:

1. Check the console logs in both terminals
2. Verify all environment variables are set correctly
3. Test the health endpoints
4. Check the GitHub issues for similar problems
5. Create a new issue with detailed error information

## 📝 Important Notes

- **API Costs**: GPT-4o-mini is cost-effective (~$0.0001/1K tokens)
- **MongoDB Limits**: Free tier has 512MB limit, upgrade if needed
- **Rate Limiting**: Default is 100 requests per 15 minutes
- **Video Length**: Longer videos take more time and tokens to process
- **Captions**: Only works with videos that have captions/subtitles

---

**🎉 Congratulations! You now have a fully functional YouTube video summarization app with AI chat capabilities.**
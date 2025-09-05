# 🚀 Deployment Guide - Make Your App Live

## ✅ Frontend Status
Your frontend is **already deployed** on Lovable and will automatically update from GitHub!

## 🎯 Backend Deployment (Required)

Your Node.js backend needs to be deployed to work with the live frontend. Here's how:

### Option 1: Render (Recommended - Free Tier)

#### Step 1: Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "**New**" → "**Web Service**"  
3. Connect your GitHub account
4. Select repository: **vid-essence-chat**
5. Configure deployment:

```
Service Name: vid-essence-backend
Environment: Node
Region: Oregon (US West) 
Branch: main
Root Directory: server
Build Command: npm install
Start Command: npm start
```

#### Step 2: Add Environment Variables
In Render dashboard, add these **Environment Variables**:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://preet1010:preet1246@portfolio.5mlqeh3.mongodb.net/vid-essence-chat?retryWrites=true&w=majority&appName=portfolio
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
JWT_SECRET=vid-essence-chat-secure-jwt-secret-production-2024-minimum-32-chars
FRONTEND_URL=https://your-lovable-project-url.lovableproject.com
```

#### Step 3: Deploy
Click "**Create Web Service**" and wait for deployment (5-10 minutes)

### Option 2: Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. "**Deploy from GitHub**" 
3. Select your repository
4. Choose the **server** folder as root
5. Add the same environment variables
6. Deploy

## 🔄 Update Frontend API URL

After backend deployment, you'll get a URL like:
- **Render**: `https://vid-essence-backend.onrender.com`
- **Railway**: `https://your-app.up.railway.app`

### Update Lovable Project

1. In your local code, update `.env`:
```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

2. Commit and push:
```bash
git add .env
git commit -m "Update API URL for production backend"
git push
```

3. **Lovable will automatically update** with the new API URL!

## 🔧 Production Environment Variables

Make sure your production backend has:

```env
# Render/Railway will provide PORT automatically
NODE_ENV=production

# Your actual MongoDB connection
MONGODB_URI=mongodb+srv://preet1010:preet1246@...

# Your OpenRouter API key  
OPENROUTER_API_KEY=sk-or-v1-d6f926cc63d96f...

# Your actual Lovable frontend URL
FRONTEND_URL=https://your-lovable-url.lovableproject.com
```

## ✅ Testing Production

1. **Backend Health Check**: Visit `https://your-backend-url.onrender.com/health`
2. **Frontend**: Visit your Lovable URL
3. **Test**: Try analyzing a YouTube video end-to-end

## 💰 Costs

- **Frontend (Lovable)**: Included in your Lovable plan
- **Backend (Render Free)**: $0/month (with sleep after 15 min inactivity)
- **Backend (Render Paid)**: $7/month (always-on)
- **Database (MongoDB Atlas)**: Free tier (512MB)
- **AI (OpenRouter)**: Pay-per-use (~$0.01-0.05 per video)

## 🚨 Important Notes

- **Free Tier Limitation**: Render free tier "sleeps" after 15 minutes of inactivity
- **First request** after sleep takes ~30 seconds to wake up
- For **production use**, consider upgrading to paid tier ($7/month)
- **MongoDB Atlas** free tier is sufficient for thousands of videos

## 🎯 Next Steps

1. **Deploy backend** to Render (15 minutes)
2. **Get backend URL** from deployment
3. **Update frontend** API URL in `.env`
4. **Push changes** to GitHub
5. **Test live app** on Lovable URL

---

**Once deployed, your app will be fully live and accessible worldwide!** 🌍
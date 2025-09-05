import ytdl from 'ytdl-core';
import { YoutubeTranscript } from 'youtube-transcript';
import fetch from 'node-fetch';

export class YouTubeService {
  constructor() {
    this.validateUrl = this.validateUrl.bind(this);
  }

  /**
   * Validate YouTube URL
   */
  validateUrl(url) {
    try {
      return ytdl.validateURL(url);
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    try {
      return ytdl.getVideoID(url);
    } catch (error) {
      const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    }
  }

  /**
   * Get video information
   */
  async getVideoInfo(url) {
    try {
      if (!this.validateUrl(url)) {
        throw new Error('Invalid YouTube URL');
      }

      const videoId = this.extractVideoId(url);
      
      // Try multiple methods to get video info
      let info;
      
      // Method 1: Use agent with more robust options
      try {
        const agent = ytdl.createAgent([
          {
            transform: (req) => {
              req.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
              };
            }
          }
        ]);
        
        info = await ytdl.getInfo(url, { agent });
      } catch (agentError) {
        console.log('Agent method failed, trying basic info method');
        
        // Method 2: Use basic info without agent
        try {
          info = await ytdl.getBasicInfo(url);
        } catch (basicError) {
          console.log('Basic info method failed, trying alternative extraction');
          
          // Method 3: Use alternative video info extraction
          const altInfo = await this.getAlternativeVideoInfo(videoId, url);
          if (altInfo) {
            info = { videoDetails: altInfo };
          } else {
            throw new Error('All video info extraction methods failed');
          }
        }
      }
      
      const videoDetails = info.videoDetails;
      
      // Safely extract data with fallbacks
      const title = videoDetails.title || 'Unknown Title';
      const description = videoDetails.description || '';
      const duration = parseInt(videoDetails.lengthSeconds) || 0;
      const thumbnails = videoDetails.thumbnails || [];
      const thumbnailUrl = thumbnails.length > 0 
        ? thumbnails[thumbnails.length - 1].url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const channelName = videoDetails.author?.name || videoDetails.ownerChannelName || 'Unknown Channel';
      const publishedAt = videoDetails.publishDate ? new Date(videoDetails.publishDate) : new Date();
      const viewCount = parseInt(videoDetails.viewCount) || 0;
      const likeCount = parseInt(videoDetails.likes) || 0;
      
      return {
        videoId,
        title,
        description,
        duration,
        thumbnailUrl,
        channelName,
        publishedAt,
        viewCount,
        likeCount,
        url
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      throw new Error(`Failed to get video information: ${error.message}`);
    }
  }

  /**
   * Get video transcript
   */
  async getTranscript(videoId) {
    try {
      const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcriptArray || transcriptArray.length === 0) {
        throw new Error('No transcript available for this video');
      }

      // Combine all transcript text
      const transcript = transcriptArray
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return transcript;
    } catch (error) {
      console.error('Error getting transcript:', error);
      
      // Try alternative transcript extraction methods
      try {
        const alternativeTranscript = await this.getAlternativeTranscript(videoId);
        return alternativeTranscript;
      } catch (altError) {
        throw new Error(`Failed to get video transcript: ${error.message}`);
      }
    }
  }

  /**
   * Alternative video info extraction method
   */
  async getAlternativeVideoInfo(videoId, url) {
    try {
      // Try to get basic info from YouTube's oEmbed API
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      
      const response = await fetch(oEmbedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.title || 'Unknown Title',
          description: '',
          lengthSeconds: '0',
          thumbnails: [{ url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }],
          author: { name: data.author_name || 'Unknown Channel' },
          publishDate: new Date(),
          viewCount: '0',
          likes: '0'
        };
      }
      
      // Fallback with basic info
      return {
        title: 'YouTube Video',
        description: '',
        lengthSeconds: '0',
        thumbnails: [{ url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }],
        author: { name: 'Unknown Channel' },
        publishDate: new Date(),
        viewCount: '0',
        likes: '0'
      };
    } catch (error) {
      console.error('Alternative video info extraction failed:', error);
      return null;
    }
  }

  /**
   * Alternative transcript extraction method
   */
  async getAlternativeTranscript(videoId) {
    try {
      // Try with different language codes
      const languages = ['en', 'en-US', 'en-GB'];
      
      for (const lang of languages) {
        try {
          const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, {
            lang,
            country: 'US'
          });
          
          if (transcriptArray && transcriptArray.length > 0) {
            return transcriptArray
              .map(item => item.text)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
        } catch (langError) {
          continue;
        }
      }
      
      throw new Error('No transcript available in supported languages');
    } catch (error) {
      throw new Error(`Alternative transcript extraction failed: ${error.message}`);
    }
  }

  /**
   * Process complete video data
   */
  async processVideo(url) {
    try {
      console.log(`Processing video: ${url}`);

      // Get video information
      const videoInfo = await this.getVideoInfo(url);
      console.log(`Video info retrieved: ${videoInfo.title}`);

      // Get transcript with fallback
      let transcript = '';
      try {
        transcript = await this.getTranscript(videoInfo.videoId);
        console.log(`Transcript retrieved: ${transcript.length} characters`);
      } catch (transcriptError) {
        console.log('Transcript not available, using fallback content');
        // Create fallback content from title and description
        transcript = `Video Title: ${videoInfo.title}\n\nChannel: ${videoInfo.channelName}\n\nDescription: ${videoInfo.description || 'No description available.'}\n\nNote: This video does not have captions/transcript available.`;
      }

      return {
        ...videoInfo,
        transcript,
        processingStatus: 'completed'
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error(`Video processing failed: ${error.message}`);
    }
  }

  /**
   * Format duration from seconds to readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clean and format transcript text
   */
  cleanTranscript(transcript) {
    return transcript
      .replace(/\[.*?\]/g, '') // Remove bracketed text
      .replace(/\(.*?\)/g, '') // Remove parenthetical text
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
      .trim();
  }

  /**
   * Extract key topics from transcript
   */
  extractKeyTopics(transcript) {
    const words = transcript.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);

    const wordFreq = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
}
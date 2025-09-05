import ytdl from 'ytdl-core';
import { YoutubeTranscript } from 'youtube-transcript';

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
      const info = await ytdl.getInfo(url);
      
      const videoDetails = info.videoDetails;
      
      return {
        videoId,
        title: videoDetails.title,
        description: videoDetails.description,
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnailUrl: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
        channelName: videoDetails.author.name,
        publishedAt: new Date(videoDetails.publishDate),
        viewCount: parseInt(videoDetails.viewCount) || 0,
        likeCount: parseInt(videoDetails.likes) || 0,
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

      // Get transcript
      const transcript = await this.getTranscript(videoInfo.videoId);
      console.log(`Transcript retrieved: ${transcript.length} characters`);

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
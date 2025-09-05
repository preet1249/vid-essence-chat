const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface VideoData {
  _id: string;
  videoId: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  channelName: string;
  publishedAt: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ChatSession {
  sessionId: string;
  videoId: string;
  messages: ChatMessage[];
  totalMessages: number;
  lastMessageAt: string;
  createdAt: string;
  isActive: boolean;
}

interface ProcessingStatus {
  videoId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  progress: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Video API methods
  async analyzeVideo(url: string): Promise<ApiResponse<{ videoId: string; status: string }>> {
    return this.request('/videos/analyze', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async getVideoStatus(videoId: string): Promise<ApiResponse<ProcessingStatus>> {
    return this.request(`/videos/status/${videoId}`);
  }

  async getVideo(videoId: string): Promise<ApiResponse<VideoData>> {
    return this.request(`/videos/${videoId}`);
  }

  async getVideoByYouTubeId(youtubeVideoId: string): Promise<ApiResponse<VideoData>> {
    return this.request(`/videos/youtube/${youtubeVideoId}`);
  }

  async getVideos(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Promise<ApiResponse<{ videos: VideoData[]; pagination: any }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/videos${query}`);
  }

  async deleteVideo(videoId: string): Promise<ApiResponse> {
    return this.request(`/videos/${videoId}`, {
      method: 'DELETE',
    });
  }

  // Chat API methods
  async startChatSession(videoId: string): Promise<ApiResponse<{ sessionId: string; videoTitle: string; videoId: string }>> {
    return this.request('/chat/start', {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    });
  }

  async sendChatMessage(sessionId: string, message: string): Promise<ApiResponse<{ message: string; sessionId: string; messageId: string }>> {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<ChatSession & { videoInfo: any }>> {
    return this.request(`/chat/session/${sessionId}`);
  }

  async getVideoChats(videoId: string, limit?: number): Promise<ApiResponse<ChatSession[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request(`/chat/video/${videoId}/sessions${query}`);
  }

  async closeChatSession(sessionId: string): Promise<ApiResponse> {
    return this.request(`/chat/session/${sessionId}/close`, {
      method: 'PUT',
    });
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse> {
    return this.request(`/chat/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // History API methods
  async getHistory(params: {
    page?: number;
    limit?: number;
    search?: string;
    bookmarked?: boolean;
    rating?: number;
    sort?: string;
  } = {}): Promise<ApiResponse<{ history: any[]; pagination: any; filters: any }>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request(`/history${query}`);
  }

  async getRecentHistory(): Promise<ApiResponse<any[]>> {
    return this.request('/history/recent');
  }

  async getBookmarks(page?: number, limit?: number): Promise<ApiResponse<{ bookmarks: any[]; pagination: any }>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/history/bookmarks${query}`);
  }

  async getHistoryStats(): Promise<ApiResponse<any>> {
    return this.request('/history/stats');
  }

  async toggleBookmark(videoId: string): Promise<ApiResponse<{ videoId: string; isBookmarked: boolean }>> {
    return this.request(`/history/${videoId}/bookmark`, {
      method: 'PUT',
    });
  }

  async rateVideo(videoId: string, rating: number): Promise<ApiResponse<{ videoId: string; rating: number }>> {
    return this.request(`/history/${videoId}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ rating }),
    });
  }

  async updateNotes(videoId: string, notes: string): Promise<ApiResponse<{ videoId: string; notes: string }>> {
    return this.request(`/history/${videoId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async removeFromHistory(videoId: string): Promise<ApiResponse> {
    return this.request(`/history/${videoId}`, {
      method: 'DELETE',
    });
  }

  async clearHistory(): Promise<ApiResponse> {
    return this.request('/history?confirm=true', {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();
export type { VideoData, ChatMessage, ChatSession, ProcessingStatus, ApiResponse };
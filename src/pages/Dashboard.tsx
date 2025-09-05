import { useState, useEffect } from 'react';
import { Youtube, Send, Loader2, MessageSquare, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient, VideoData, ChatMessage } from '@/lib/api';

const Dashboard = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) return;
    
    try {
      setIsAnalyzing(true);
      setCurrentVideo(null);
      setShowChatbot(false);
      setChatMessages([]);
      setChatSessionId(null);

      toast({
        title: "Processing video",
        description: "Analyzing the video content...",
      });

      const response = await apiClient.analyzeVideo(videoUrl);
      
      if (response.success && response.data) {
        setProcessingVideoId(response.data.videoId);
        // Start polling for status updates
        pollVideoStatus(response.data.videoId);
      } else {
        throw new Error(response.error || 'Failed to start video processing');
      }
    } catch (error) {
      console.error('Video analysis error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze video",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    try {
      const statusResponse = await apiClient.getVideoStatus(videoId);
      
      if (statusResponse.success && statusResponse.data) {
        const { status, progress } = statusResponse.data;
        
        if (status === 'completed') {
          // Video processing completed, get the full video data
          const videoResponse = await apiClient.getVideo(videoId);
          
          if (videoResponse.success && videoResponse.data) {
            setCurrentVideo(videoResponse.data);
            setShowChatbot(true);
            setIsAnalyzing(false);
            
            toast({
              title: "Success",
              description: "Video analysis completed!",
            });
          }
        } else if (status === 'failed') {
          setIsAnalyzing(false);
          toast({
            title: "Error",
            description: statusResponse.data.error || "Video processing failed",
            variant: "destructive",
          });
        } else {
          // Still processing, continue polling
          setTimeout(() => pollVideoStatus(videoId), 2000);
        }
      }
    } catch (error) {
      console.error('Status polling error:', error);
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: "Failed to check processing status",
        variant: "destructive",
      });
    }
  };

  const initializeChatSession = async () => {
    if (!currentVideo || chatSessionId) return;

    try {
      const response = await apiClient.startChatSession(currentVideo._id);
      
      if (response.success && response.data) {
        setChatSessionId(response.data.sessionId);
      }
    } catch (error) {
      console.error('Failed to start chat session:', error);
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatSessionId) return;
    
    const userMessage: ChatMessage = {
      _id: Date.now().toString(),
      content: chatInput,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    
    try {
      const response = await apiClient.sendChatMessage(chatSessionId, chatInput);
      
      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          _id: response.data.messageId,
          content: response.data.message,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat message error:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Initialize chat session when video is ready
  useEffect(() => {
    if (currentVideo && showChatbot && !chatSessionId) {
      initializeChatSession();
    }
  }, [currentVideo, showChatbot, chatSessionId]);

  // Check for video URL in query parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoParam = urlParams.get('video');
    
    if (videoParam && !videoUrl && !isAnalyzing && !currentVideo) {
      setVideoUrl(videoParam);
      // Auto-trigger analysis if URL is valid
      if (isValidYouTubeUrl(videoParam)) {
        setTimeout(() => {
          // Use a slight delay to ensure state is updated
          handleAnalyze();
        }, 100);
      }
    }
  }, []);

  const isValidYouTubeUrl = (url: string) => {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center shadow-soft">
              <Youtube className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading text-brand-primary mb-4">
            YouTube Video Summarizer
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Get instant AI-powered summaries of any YouTube video and ask questions to dive deeper into the content.
          </p>
        </div>

        {/* URL Input Section */}
        <Card className="mb-8 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-brand-primary">
              <Youtube className="w-5 h-5" />
              <span>Enter YouTube URL</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleAnalyze}
                disabled={!videoUrl.trim() || !isValidYouTubeUrl(videoUrl) || isAnalyzing}
                className="sm:w-auto w-full"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
              </Button>
            </div>
            {videoUrl && !isValidYouTubeUrl(videoUrl) && (
              <p className="text-sm text-error">Please enter a valid YouTube URL</p>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="mb-8 shadow-medium">
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-accent" />
                <h3 className="text-lg font-heading text-brand-primary mb-2">Analyzing Video</h3>
                <p className="text-text-secondary">AI is processing the video content and generating a summary...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Results */}
        {currentVideo && (
          <Card className="mb-8 shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={currentVideo.thumbnailUrl} 
                    alt={currentVideo.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div>
                    <CardTitle className="text-brand-primary text-lg">{currentVideo.title}</CardTitle>
                    <p className="text-sm text-text-secondary">{currentVideo.channelName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    Complete
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-text-muted">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor(currentVideo.duration / 60)}:{(currentVideo.duration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{currentVideo.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-brand-primary">AI Summary</h3>
                <div className="prose prose-slate max-w-none">
                  {currentVideo.summary.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-text-primary mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              {currentVideo.keyPoints && currentVideo.keyPoints.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-brand-primary">Key Points</h3>
                  <ul className="space-y-2">
                    {currentVideo.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-brand-accent mt-1">•</span>
                        <span className="text-text-primary">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentVideo.tags && currentVideo.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-brand-primary">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentVideo.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chatbot Section */}
        {showChatbot && (
          <Card className="shadow-large">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-brand-primary">
                <MessageSquare className="w-5 h-5" />
                <span>Ask Questions About This Video</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto mb-4 space-y-3 p-4 bg-surface rounded-lg">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-text-muted">
                    Ask me anything about the video content!
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-brand-primary text-white'
                            : 'bg-surface-secondary text-text-primary'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="flex space-x-3">
                <Input
                  placeholder="Ask about the video content..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!chatInput.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
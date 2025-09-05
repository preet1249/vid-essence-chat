import { useState } from 'react';
import { Youtube, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'bot'}>>([]);
  const [chatInput, setChatInput] = useState('');

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate API call - will need Supabase integration for real implementation
    setTimeout(() => {
      setSummary("This video provides an excellent overview of modern web development practices. The presenter discusses key concepts including React hooks, state management, and component architecture. The content is well-structured and provides practical examples that developers can implement immediately.\n\nThe second part focuses on advanced techniques for optimizing application performance. Topics covered include lazy loading, code splitting, and effective use of caching strategies. The explanations are clear and accompanied by real-world scenarios.\n\nOverall, this is a comprehensive resource for developers looking to improve their skills in modern web development. The practical approach and detailed examples make it suitable for both intermediate and advanced developers.");
      setShowChatbot(true);
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: chatInput,
      sender: 'user' as const
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: "That's a great question! Based on the video content, I can provide more details about that specific topic. The presenter emphasized the importance of proper implementation and best practices.",
        sender: 'bot' as const
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

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

        {/* Summary Results */}
        {summary && (
          <Card className="mb-8 shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-brand-primary">AI Summary</CardTitle>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                {summary.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-text-primary mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
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
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-brand-primary text-white'
                            : 'bg-surface-secondary text-text-primary'
                        }`}
                      >
                        {message.text}
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
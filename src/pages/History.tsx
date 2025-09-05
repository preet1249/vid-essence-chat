import { useState } from 'react';
import { Clock, MessageSquare, Youtube, Search, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  chatCount: number;
  createdAt: string;
  lastAccessed: string;
}

const History = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - will be replaced with real data from Supabase
  const historyItems: HistoryItem[] = [
    {
      id: '1',
      title: 'Modern Web Development Best Practices 2024',
      url: 'https://youtube.com/watch?v=example1',
      summary: 'Comprehensive guide covering React hooks, state management, and component architecture with practical examples.',
      chatCount: 5,
      createdAt: '2024-01-15',
      lastAccessed: '2024-01-16'
    },
    {
      id: '2',
      title: 'JavaScript Performance Optimization Techniques',
      url: 'https://youtube.com/watch?v=example2',
      summary: 'Advanced techniques for optimizing JavaScript applications including lazy loading and code splitting strategies.',
      chatCount: 12,
      createdAt: '2024-01-14',
      lastAccessed: '2024-01-15'
    },
    {
      id: '3',
      title: 'Understanding Machine Learning Fundamentals',
      url: 'https://youtube.com/watch?v=example3',
      summary: 'Introduction to ML concepts, algorithms, and practical applications in modern software development.',
      chatCount: 3,
      createdAt: '2024-01-12',
      lastAccessed: '2024-01-12'
    }
  ];

  const filteredItems = historyItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = (id: string) => {
    // Will implement with Supabase
    console.log('Delete item:', id);
  };

  const handleReopen = (item: HistoryItem) => {
    // Will implement navigation to dashboard with pre-filled data
    console.log('Reopen item:', item);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-brand-primary">
              History
            </h1>
          </div>
          <p className="text-lg text-text-secondary">
            Access all your past video summaries and chat conversations.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 shadow-soft">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="text"
                placeholder="Search your history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-heading text-brand-primary mb-1">
                {historyItems.length}
              </div>
              <div className="text-sm text-text-muted">Total Summaries</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-heading text-brand-primary mb-1">
                {historyItems.reduce((sum, item) => sum + item.chatCount, 0)}
              </div>
              <div className="text-sm text-text-muted">Chat Messages</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-heading text-brand-primary mb-1">
                {historyItems.filter(item => 
                  new Date(item.lastAccessed).toDateString() === new Date().toDateString()
                ).length}
              </div>
              <div className="text-sm text-text-muted">Today's Activity</div>
            </CardContent>
          </Card>
        </div>

        {/* History Items */}
        {filteredItems.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-16 text-center">
              <Youtube className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-heading text-text-primary mb-2">
                {searchQuery ? 'No matching results' : 'No history yet'}
              </h3>
              <p className="text-text-muted mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Start by analyzing your first YouTube video on the dashboard'
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-brand-primary hover:bg-brand-secondary"
                >
                  Go to Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl text-brand-primary mb-2 line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Created {formatDate(item.createdAt)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{item.chatCount} messages</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        Completed
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-4 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(item)}
                        className="flex items-center space-x-2"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Continue Chat</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(item.url, '_blank')}
                        className="flex items-center space-x-2 text-text-muted hover:text-text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Original Video</span>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
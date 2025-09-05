import { useState, useEffect } from 'react';
import { Clock, MessageSquare, Youtube, Search, Trash2, ExternalLink, Star, BookmarkIcon, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface HistoryItem {
  _id: string;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl: string;
  channelName: string;
  duration: number;
  summary: string;
  keyPoints: string[];
  tags: string[];
  chatSessionCount: number;
  lastAccessedAt: string;
  accessCount: number;
  isBookmarked: boolean;
  rating?: number;
  notes?: string;
  createdAt: string;
}

interface HistoryStats {
  totalVideos: number;
  totalBookmarks: number;
  ratedVideos: number;
  recentActivity: number;
  ratingDistribution: { [key: string]: number };
  topChannels: { name: string; count: number }[];
}

const History = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [searchQuery, sortBy, filterBy, currentPage]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
        sort: sortBy
      };

      if (searchQuery.trim()) {
        params.search = searchQuery;
      }

      if (filterBy === 'bookmarked') {
        params.bookmarked = true;
      } else if (filterBy.startsWith('rating-')) {
        params.rating = parseInt(filterBy.split('-')[1]);
      }

      const response = await apiClient.getHistory(params);

      if (response.success && response.data) {
        setHistoryItems(response.data.history);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.getHistoryStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleToggleBookmark = async (videoId: string, currentlyBookmarked: boolean) => {
    try {
      const response = await apiClient.toggleBookmark(videoId);
      
      if (response.success) {
        setHistoryItems(items =>
          items.map(item =>
            item.videoId === videoId
              ? { ...item, isBookmarked: !currentlyBookmarked }
              : item
          )
        );
        
        toast({
          title: currentlyBookmarked ? "Bookmark removed" : "Bookmarked",
          description: currentlyBookmarked 
            ? "Video removed from bookmarks" 
            : "Video added to bookmarks",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const handleRating = async (videoId: string, rating: number) => {
    try {
      const response = await apiClient.rateVideo(videoId, rating);
      
      if (response.success) {
        setHistoryItems(items =>
          items.map(item =>
            item.videoId === videoId
              ? { ...item, rating }
              : item
          )
        );
        
        toast({
          title: "Rating saved",
          description: `Video rated ${rating} star${rating > 1 ? 's' : ''}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to remove this video from your history?')) {
      return;
    }

    try {
      const response = await apiClient.removeFromHistory(videoId);
      
      if (response.success) {
        setHistoryItems(items => items.filter(item => item.videoId !== videoId));
        toast({
          title: "Removed",
          description: "Video removed from history",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove video",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReopen = (item: HistoryItem) => {
    // Navigate to dashboard with the video URL pre-filled
    const url = new URL(window.location.origin);
    url.searchParams.set('video', item.videoUrl);
    window.location.href = url.toString();
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

        {/* Search and Filters */}
        <Card className="mb-8 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Search your history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="channel">Channel</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Videos</SelectItem>
                  <SelectItem value="bookmarked">Bookmarked</SelectItem>
                  <SelectItem value="rating-5">5 Stars</SelectItem>
                  <SelectItem value="rating-4">4+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-soft">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-heading text-brand-primary mb-1">
                  {stats.totalVideos}
                </div>
                <div className="text-sm text-text-muted">Total Videos</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-heading text-brand-primary mb-1">
                  {stats.totalBookmarks}
                </div>
                <div className="text-sm text-text-muted">Bookmarked</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-heading text-brand-primary mb-1">
                  {stats.ratedVideos}
                </div>
                <div className="text-sm text-text-muted">Rated Videos</div>
              </CardContent>
            </Card>
            <Card className="shadow-soft">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-heading text-brand-primary mb-1">
                  {stats.recentActivity}
                </div>
                <div className="text-sm text-text-muted">Recent Activity</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Items */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : historyItems.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-16 text-center">
              <Youtube className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-heading text-text-primary mb-2">
                {searchQuery || filterBy !== 'all' ? 'No matching results' : 'No history yet'}
              </h3>
              <p className="text-text-muted mb-6">
                {searchQuery || filterBy !== 'all'
                  ? 'Try adjusting your search terms or filters'
                  : 'Start by analyzing your first YouTube video on the dashboard'
                }
              </p>
              {!searchQuery && filterBy === 'all' && (
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
            {historyItems.map((item) => (
              <Card key={item._id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1 min-w-0">
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.videoTitle}
                        className="w-20 h-15 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl text-brand-primary mb-2 line-clamp-2">
                          {item.videoTitle}
                        </CardTitle>
                        <p className="text-sm text-text-secondary mb-2">{item.channelName}</p>
                        <div className="flex items-center space-x-4 text-sm text-text-muted">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(item.duration)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>Accessed {item.accessCount} time{item.accessCount !== 1 ? 's' : ''}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{item.chatSessionCount} chat sessions</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleBookmark(item.videoId, item.isBookmarked)}
                        className={item.isBookmarked ? 'text-brand-accent' : 'text-text-muted'}
                      >
                        <BookmarkIcon className={`w-4 h-4 ${item.isBookmarked ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary mb-4 line-clamp-2">
                    {item.summary}
                  </p>
                  
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.slice(0, 4).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

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
                        onClick={() => window.open(item.videoUrl, '_blank')}
                        className="flex items-center space-x-2 text-text-muted hover:text-text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Original Video</span>
                      </Button>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRating(item.videoId, rating)}
                            className={`w-4 h-4 ${
                              item.rating && rating <= item.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="w-full h-full" />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-muted">
                        {formatDate(item.lastAccessedAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.videoId)}
                        className="text-error hover:text-error hover:bg-error/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
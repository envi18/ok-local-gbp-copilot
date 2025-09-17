import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Clock, TrendingUp, Filter, Search, MoreVertical, Reply, Flag, Share, Download, Eye, ChevronDown, Calendar, User, ThumbsUp, ThumbsDown, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { dataService, type Review, type Location, type Profile } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'responded' | 'pending' | 'flagged'>('all');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'google' | 'facebook' | 'yelp'>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [showReplyModal, setShowReplyModal] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    initializeReviews();
  }, []);

  const initializeReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Initialize user profile
      const userProfile = await dataService.initializeUserData(user);
      if (!userProfile) {
        setError('Failed to initialize user profile');
        return;
      }
      setProfile(userProfile);

      // Get locations and reviews
      const [locationsData, reviewsData] = await Promise.all([
        dataService.getLocations(userProfile.organization_id),
        dataService.getReviews()
      ]);

      setLocations(locationsData);
      setReviews(reviewsData);

    } catch (err) {
      console.error('Reviews initialization error:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const replyTemplates = [
    { id: 'grateful', name: 'Grateful Response', text: 'Thank you so much for your wonderful review! We\'re thrilled to hear about your positive experience.' },
    { id: 'apologetic', name: 'Apologetic Response', text: 'We sincerely apologize for not meeting your expectations. We\'d love the opportunity to make this right.' },
    { id: 'professional', name: 'Professional Response', text: 'Thank you for taking the time to share your feedback. We appreciate your business and look forward to serving you again.' }
  ];

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getResponseStatus = (review: Review): 'responded' | 'pending' | 'flagged' => {
    if (review.response_text) return 'responded';
    if (review.rating <= 2) return 'flagged';
    return 'pending';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const filteredReviews = reviews.filter(review => {
    const responseStatus = getResponseStatus(review);
    const matchesFilter = selectedFilter === 'all' || responseStatus === selectedFilter;
    const matchesRating = selectedRating === 'all' || review.rating === selectedRating;
    const matchesPlatform = selectedPlatform === 'all' || review.platform === selectedPlatform;
    const matchesLocation = selectedLocation === 'all' || review.location_id === selectedLocation;
    const matchesSearch = searchTerm === '' || 
      (review.author_name && review.author_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.text && review.text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesRating && matchesPlatform && matchesLocation && matchesSearch;
  });

  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0',
    newToday: reviews.filter(r => {
      const reviewDate = new Date(r.created_at);
      const today = new Date();
      return reviewDate.toDateString() === today.toDateString();
    }).length,
    responseRate: reviews.length > 0 ? Math.round((reviews.filter(r => r.response_text).length / reviews.length) * 100) : 0,
    avgResponseTime: '2.3 hours',
    sentiment: {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    subtitle?: string;
    loading?: boolean;
  }> = ({ title, value, icon: Icon, gradient, subtitle, loading = false }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const getPlatformBadge = (platform: string) => {
    const badges = {
      google: <Badge variant="info" size="sm">Google</Badge>,
      facebook: <Badge variant="gradient" size="sm">Facebook</Badge>,
      yelp: <Badge variant="warning" size="sm">Yelp</Badge>
    };
    return badges[platform as keyof typeof badges];
  };

  const getSentimentBadge = (sentiment: string) => {
    const badges = {
      positive: <Badge variant="success" size="sm">Positive</Badge>,
      neutral: <Badge variant="info" size="sm">Neutral</Badge>,
      negative: <Badge variant="error" size="sm">Negative</Badge>
    };
    return badges[sentiment as keyof typeof badges];
  };

  const getResponseStatusBadge = (status: string) => {
    const badges = {
      responded: <Badge variant="success" size="sm">Responded</Badge>,
      pending: <Badge variant="warning" size="sm">Pending</Badge>,
      flagged: <Badge variant="error" size="sm">Flagged</Badge>
    };
    return badges[status as keyof typeof badges];
  };

  const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );

  const generateAvatar = (name: string) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-indigo-500 to-indigo-600'
    ];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
    
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${colors[colorIndex]}`}>
        {initials}
      </div>
    );
  };

  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    const responseStatus = getResponseStatus(review);
    const locationName = getLocationName(review.location_id);
    const timeAgo = formatTimeAgo(review.created_at_external || review.created_at);

    return (
      <Card hover className="group">
        <div className="flex items-start gap-4">
          {generateAvatar(review.author_name || 'Anonymous')}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {review.author_name || 'Anonymous'}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{timeAgo}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-500">• {locationName}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getPlatformBadge(review.platform)}
                <Button variant="ghost" size="sm">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>

            {review.text && (
              <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {review.text}
              </p>
            )}

            <div className="flex items-center gap-3 mb-3">
              {getSentimentBadge(review.sentiment)}
              {getResponseStatusBadge(responseStatus)}
            </div>

            {review.response_text && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Reply size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Business Response</span>
                  {review.responded_at && (
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      • {formatTimeAgo(review.responded_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{review.response_text}</p>
              </div>
            )}

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyModal(review.id)}
                disabled={!!review.response_text}
              >
                <Reply size={16} />
                {review.response_text ? 'Edit Reply' : 'Reply'}
              </Button>
              <Button variant="ghost" size="sm">
                <Flag size={16} />
                Flag
              </Button>
              <Button variant="ghost" size="sm">
                <Share size={16} />
                Share
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Review Management
            </h1>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64 mt-2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <StatCard key={i} title="Loading..." value="" icon={MessageSquare} gradient="bg-gray-400" loading />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card>
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Reviews</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={initializeReviews}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Review Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.totalReviews} total reviews • {stats.averageRating} average rating
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">Bulk Actions</Button>
          <Button variant="secondary">Templates</Button>
          <Button>Generate QR Code</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <StatCard
          title="New Today"
          value={stats.newToday}
          icon={MessageSquare}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          icon={Reply}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Avg Response Time"
          value={stats.avgResponseTime}
          icon={Clock}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Positive"
          value={stats.sentiment.positive}
          icon={ThumbsUp}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
          subtitle="sentiment"
        />
        <StatCard
          title="Negative"
          value={stats.sentiment.negative}
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
          subtitle="needs attention"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
              />
            </div>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="flagged">Flagged</option>
            </select>

            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="yelp">Yelp</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
                <MessageSquare size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {reviews.length === 0 ? 'No Reviews Yet' : 'No Reviews Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {reviews.length === 0 
                  ? 'Customer reviews will appear here once they start coming in.'
                  : 'No reviews match your current filters. Try adjusting your search criteria.'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reply to Review
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyModal(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    const template = replyTemplates.find(t => t.id === e.target.value);
                    if (template) setReplyText(template.text);
                  }}
                  className="w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                >
                  <option value="">Select a template...</option>
                  {replyTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Response
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent resize-none"
                  placeholder="Write your response..."
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {replyText.length}/500 characters
                  </span>
                  <Button variant="ghost" size="sm">
                    AI Suggest
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowReplyModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!replyText.trim()}
              >
                Post Response
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};


import { Bot, Calendar, Clock, Image, Info, MessageSquare, RotateCcw, Save, Settings, Sparkles, Star, Zap } from 'lucide-react';
import React, { useState } from 'react';

type ReviewAutomationSetting = 'ai-suggest' | 'ai-automated' | 'manual';
type PostScheduleSetting = 'daily' | 'weekly' | 'monthly' | 'custom';
type PhotoSyncSetting = 'instant' | 'daily' | 'weekly' | 'manual';

interface ReviewAutomationSettings {
  oneStar: ReviewAutomationSetting;
  twoStar: ReviewAutomationSetting;
  threeStar: ReviewAutomationSetting;
  fourStar: ReviewAutomationSetting;
  fiveStar: ReviewAutomationSetting;
}

interface PostScheduleSettings {
  frequency: PostScheduleSetting;
  daysOfWeek: string[];
  timeOfDay: string;
  postTypes: string[];
  includePromos: boolean;
  includeEvents: boolean;
  autoHashtags: boolean;
  maxPostsPerDay: number;
  locations: string[];
}

interface PhotoSyncSettings {
  syncFrequency: PhotoSyncSetting;
  autoOptimize: boolean;
  maxPhotosPerSync: number;
  excludeOldPhotos: boolean;
  addWatermark: boolean;
  resizeImages: boolean;
  syncToAllLocations: boolean;
  allowedFormats: string[];
}

// Inline UI Components with proper TypeScript types
const Badge: React.FC<{ 
  variant: 'success' | 'warning' | 'error' | 'info' | 'gradient'; 
  size: 'sm' | 'md' | 'lg'; 
  children: React.ReactNode 
}> = ({ variant, size, children }) => {
  const variantClasses = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    gradient: 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

const Button: React.FC<{ 
  variant?: 'primary' | 'secondary' | 'ghost'; 
  size?: 'sm' | 'md'; 
  onClick?: () => void; 
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ variant = 'primary', size = 'md', onClick, disabled, children }) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white hover:from-[#e53e3e] hover:to-[#d73027] shadow-lg',
    secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center rounded-lg font-medium transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Card: React.FC<{ hover?: boolean; children: React.ReactNode }> = ({ hover, children }) => (
  <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 ${hover ? 'hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-200' : ''}`}>
    {children}
  </div>
);

export const Automations: React.FC = () => {
  const [reviewSettings, setReviewSettings] = useState<ReviewAutomationSettings>({
    oneStar: 'ai-suggest',
    twoStar: 'ai-suggest',
    threeStar: 'ai-automated',
    fourStar: 'ai-automated',
    fiveStar: 'ai-automated'
  });

  const [postSettings, setPostSettings] = useState<PostScheduleSettings>({
    frequency: 'weekly',
    daysOfWeek: ['Tuesday', 'Friday'],
    timeOfDay: '09:00',
    postTypes: ['promotional', 'behind-the-scenes'],
    includePromos: true,
    includeEvents: false,
    autoHashtags: true,
    maxPostsPerDay: 2,
    locations: ['all']
  });

  const [photoSettings, setPhotoSettings] = useState<PhotoSyncSettings>({
    syncFrequency: 'daily',
    autoOptimize: true,
    maxPhotosPerSync: 5,
    excludeOldPhotos: true,
    addWatermark: false,
    resizeImages: true,
    syncToAllLocations: true,
    allowedFormats: ['jpg', 'png', 'webp']
  });

  const [unsavedSections, setUnsavedSections] = useState<Set<string>>(new Set());
  const [savingSections, setSavingSections] = useState<Set<string>>(new Set());

  const handleReviewSettingChange = (starRating: keyof ReviewAutomationSettings, setting: ReviewAutomationSetting) => {
    setReviewSettings(prev => ({
      ...prev,
      [starRating]: setting
    }));
    setUnsavedSections(prev => new Set(prev).add('reviews'));
  };

  const handlePostSettingChange = (key: keyof PostScheduleSettings, value: any) => {
    setPostSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedSections(prev => new Set(prev).add('posts'));
  };

  const handlePhotoSettingChange = (key: keyof PhotoSyncSettings, value: any) => {
    setPhotoSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedSections(prev => new Set(prev).add('photos'));
  };

  const handleSaveSection = async (section: string) => {
    setSavingSections(prev => new Set(prev).add(section));
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSavingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
    
    setUnsavedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
  };

  const handleResetSection = (section: string) => {
    if (section === 'reviews') {
      setReviewSettings({
        oneStar: 'ai-suggest',
        twoStar: 'ai-suggest',
        threeStar: 'ai-automated',
        fourStar: 'ai-automated',
        fiveStar: 'ai-automated'
      });
    } else if (section === 'posts') {
      setPostSettings({
        frequency: 'weekly',
        daysOfWeek: ['Tuesday', 'Friday'],
        timeOfDay: '09:00',
        postTypes: ['promotional', 'behind-the-scenes'],
        includePromos: true,
        includeEvents: false,
        autoHashtags: true,
        maxPostsPerDay: 2,
        locations: ['all']
      });
    } else if (section === 'photos') {
      setPhotoSettings({
        syncFrequency: 'daily',
        autoOptimize: true,
        maxPhotosPerSync: 5,
        excludeOldPhotos: true,
        addWatermark: false,
        resizeImages: true,
        syncToAllLocations: true,
        allowedFormats: ['jpg', 'png', 'webp']
      });
    }
    
    setUnsavedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section);
      return newSet;
    });
  };

  const getSettingBadge = (setting: ReviewAutomationSetting) => {
    switch (setting) {
      case 'ai-suggest':
        return <Badge variant="info" size="sm">AI Suggest + Approval</Badge>;
      case 'ai-automated':
        return <Badge variant="success" size="sm">AI Fully Automated</Badge>;
      case 'manual':
        return <Badge variant="warning" size="sm">Manual Only</Badge>;
    }
  };

  const getSettingDescription = (setting: ReviewAutomationSetting) => {
    switch (setting) {
      case 'ai-suggest':
        return 'AI will suggest replies and wait for your approval';
      case 'ai-automated':
        return 'AI will automatically reply to reviews';
      case 'manual':
        return 'You will manually write all responses';
    }
  };

  const ReviewAutomationCard: React.FC<{
    starCount: number;
    starKey: keyof ReviewAutomationSettings;
    setting: ReviewAutomationSetting;
  }> = ({ starCount, starKey, setting }) => (
    <Card hover>
      <div className="space-y-4">
        {/* Header with stars and title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(starCount)].map((_, i) => (
                <Star key={i} size={18} className="text-yellow-500 fill-current" />
              ))}
              {[...Array(5 - starCount)].map((_, i) => (
                <Star key={i + starCount} size={18} className="text-gray-300 dark:text-gray-600" />
              ))}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {starCount} Star
            </h3>
          </div>
        </div>
        
        {/* Status badge */}
        <div className="flex justify-start">
          {getSettingBadge(setting)}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getSettingDescription(setting)}
        </p>

        {/* Button options instead of radio buttons */}
        <div className="space-y-2">
          {(['ai-suggest', 'ai-automated', 'manual'] as const).map((option) => (
            <button
              key={option}
              onClick={() => handleReviewSettingChange(starKey, option)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                setting === option
                  ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-green-500/50 hover:bg-green-500/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {option === 'ai-suggest' && <Bot size={16} className={setting === option ? 'text-[#f45a4e]' : 'text-blue-500'} />}
                {option === 'ai-automated' && <Sparkles size={16} className={setting === option ? 'text-[#f45a4e]' : 'text-green-500'} />}
                {option === 'manual' && <MessageSquare size={16} className={setting === option ? 'text-[#f45a4e]' : 'text-amber-500'} />}
                <span className="text-sm font-medium">
                  {option === 'ai-suggest' && 'AI Suggest + Approval'}
                  {option === 'ai-automated' && 'AI Fully Automated'}
                  {option === 'manual' && 'Manual Only'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
  }> = ({ title, value, icon: Icon, gradient }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const SectionHeader: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    section: string;
  }> = ({ title, description, icon: Icon, gradient, section }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      
      {unsavedSections.has(section) && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResetSection(section)}
          >
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSaveSection(section)}
            disabled={savingSections.has(section)}
          >
            <Save size={16} className="mr-2" />
            {savingSections.has(section) ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Automations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure automated workflows and AI responses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Settings size={16} className="mr-2" />
            Global Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatCard
          title="Active Automations"
          value={3}
          icon={Zap}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="AI Responses Today"
          value={12}
          icon={Bot}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Time Saved This Week"
          value="4.2h"
          icon={Clock}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
      </div>

      {/* Review Management Section */}
      <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-6 border border-blue-100/50 dark:border-blue-800/30">
        <div className="space-y-6">
          <SectionHeader
            title="Review Management"
            description="Configure how AI handles different star ratings"
            icon={MessageSquare}
            gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
            section="reviews"
          />

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">AI Response Guidelines:</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• <strong>AI Suggest + Approval:</strong> AI drafts responses that you review and approve before posting</li>
                  <li>• <strong>AI Fully Automated:</strong> AI automatically responds using best practices and your brand voice</li>
                  <li>• <strong>Manual Only:</strong> You write and post all responses yourself</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <ReviewAutomationCard
              starCount={1}
              starKey="oneStar"
              setting={reviewSettings.oneStar}
            />
            <ReviewAutomationCard
              starCount={2}
              starKey="twoStar"
              setting={reviewSettings.twoStar}
            />
            <ReviewAutomationCard
              starCount={3}
              starKey="threeStar"
              setting={reviewSettings.threeStar}
            />
            <ReviewAutomationCard
              starCount={4}
              starKey="fourStar"
              setting={reviewSettings.fourStar}
            />
            <ReviewAutomationCard
              starCount={5}
              starKey="fiveStar"
              setting={reviewSettings.fiveStar}
            />
          </div>
        </div>
      </div>

      {/* Post Scheduling Section */}
      <div className="bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-900/10 dark:to-teal-900/10 rounded-2xl p-6 border border-green-100/50 dark:border-green-800/30">
        <div className="space-y-6">
          <SectionHeader
            title="Post Scheduling"
            description="Automate social media posts across all locations"
            icon={Calendar}
            gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
            section="posts"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Schedule Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Posting Frequency
                  </label>
                  <select
                    value={postSettings.frequency}
                    onChange={(e) => handlePostSettingChange('frequency', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button
                        key={day}
                        onClick={() => {
                          const newDays = postSettings.daysOfWeek.includes(day)
                            ? postSettings.daysOfWeek.filter(d => d !== day)
                            : [...postSettings.daysOfWeek, day];
                          handlePostSettingChange('daysOfWeek', newDays);
                        }}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                          postSettings.daysOfWeek.includes(day)
                            ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-green-500/50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time of Day
                  </label>
                  <input
                    type="time"
                    value={postSettings.timeOfDay}
                    onChange={(e) => handlePostSettingChange('timeOfDay', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Content Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Post Types
                  </label>
                  <div className="space-y-2">
                    {['promotional', 'behind-the-scenes', 'customer-features', 'educational', 'seasonal'].map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          const newTypes = postSettings.postTypes.includes(type)
                            ? postSettings.postTypes.filter(t => t !== type)
                            : [...postSettings.postTypes, type];
                          handlePostSettingChange('postTypes', newTypes);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                          postSettings.postTypes.includes(type)
                            ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-green-500/50'
                        }`}
                      >
                        <span className="text-sm font-medium capitalize">{type.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Auto-generate hashtags</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={postSettings.autoHashtags}
                        onChange={(e) => handlePostSettingChange('autoHashtags', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        postSettings.autoHashtags
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          postSettings.autoHashtags ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Include promotional content</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={postSettings.includePromos}
                        onChange={(e) => handlePostSettingChange('includePromos', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        postSettings.includePromos
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          postSettings.includePromos ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Include upcoming events</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={postSettings.includeEvents}
                        onChange={(e) => handlePostSettingChange('includeEvents', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        postSettings.includeEvents
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          postSettings.includeEvents ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Posts Per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={postSettings.maxPostsPerDay}
                    onChange={(e) => handlePostSettingChange('maxPostsPerDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Photo Sync Section */}
      <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-100/50 dark:border-purple-800/30">
        <div className="space-y-6">
          <SectionHeader
            title="Photo Sync Manager"
            description="Automatically sync and optimize photos to Google Business Profiles"
            icon={Image}
            gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
            section="photos"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Sync Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sync Frequency
                  </label>
                  <select
                    value={photoSettings.syncFrequency}
                    onChange={(e) => handlePhotoSettingChange('syncFrequency', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="instant">Instant (when uploaded)</option>
                    <option value="daily">Daily at 9:00 AM</option>
                    <option value="weekly">Weekly on Mondays</option>
                    <option value="manual">Manual only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Photos Per Sync
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={photoSettings.maxPhotosPerSync}
                    onChange={(e) => handlePhotoSettingChange('maxPhotosPerSync', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allowed Formats
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['jpg', 'png', 'webp', 'gif'].map(format => (
                      <button
                        key={format}
                        onClick={() => {
                          const newFormats = photoSettings.allowedFormats.includes(format)
                            ? photoSettings.allowedFormats.filter(f => f !== format)
                            : [...photoSettings.allowedFormats, format];
                          handlePhotoSettingChange('allowedFormats', newFormats);
                        }}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 uppercase ${
                          photoSettings.allowedFormats.includes(format)
                            ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-green-500/50'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Optimization Settings</h4>
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Auto-optimize image quality</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={photoSettings.autoOptimize}
                        onChange={(e) => handlePhotoSettingChange('autoOptimize', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        photoSettings.autoOptimize
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          photoSettings.autoOptimize ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Resize images for web</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={photoSettings.resizeImages}
                        onChange={(e) => handlePhotoSettingChange('resizeImages', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        photoSettings.resizeImages
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          photoSettings.resizeImages ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Add business watermark</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={photoSettings.addWatermark}
                        onChange={(e) => handlePhotoSettingChange('addWatermark', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        photoSettings.addWatermark
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          photoSettings.addWatermark ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Exclude photos older than 30 days</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={photoSettings.excludeOldPhotos}
                        onChange={(e) => handlePhotoSettingChange('excludeOldPhotos', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        photoSettings.excludeOldPhotos
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          photoSettings.excludeOldPhotos ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 cursor-pointer transition-all duration-200 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Sync to all locations</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={photoSettings.syncToAllLocations}
                        onChange={(e) => handlePhotoSettingChange('syncToAllLocations', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                        photoSettings.syncToAllLocations
                          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] shadow-md'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform ${
                          photoSettings.syncToAllLocations ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
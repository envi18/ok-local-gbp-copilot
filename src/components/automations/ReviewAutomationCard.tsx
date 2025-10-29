// src/components/automations/ReviewAutomationCard.tsx
// Individual star rating automation card

import { Bot, CheckCircle, MessageSquare, Sparkles, Star } from 'lucide-react';
import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

type ReviewAutomationSetting = 'ai-suggest' | 'ai-automated' | 'manual';

interface ReviewAutomationCardProps {
  starCount: number;
  setting: ReviewAutomationSetting;
  onChange: (setting: ReviewAutomationSetting) => void;
}

export const ReviewAutomationCard: React.FC<ReviewAutomationCardProps> = ({
  starCount,
  setting,
  onChange
}) => {
  const getSettingBadge = (s: ReviewAutomationSetting) => {
    switch (s) {
      case 'ai-suggest':
        return <Badge variant="info" size="sm">AI Suggest + Approval</Badge>;
      case 'ai-automated':
        return <Badge variant="success" size="sm">AI Fully Automated</Badge>;
      case 'manual':
        return <Badge variant="warning" size="sm">Manual Only</Badge>;
    }
  };

  const getSettingDescription = (s: ReviewAutomationSetting) => {
    switch (s) {
      case 'ai-suggest':
        return 'AI will suggest replies and wait for your approval';
      case 'ai-automated':
        return 'AI will automatically reply to reviews';
      case 'manual':
        return 'You will manually write all responses';
    }
  };

  return (
    <Card hover={true}>
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

        {/* Button options */}
        <div className="space-y-2">
          {(['ai-suggest', 'ai-automated', 'manual'] as const).map((option) => (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                setting === option
                  ? 'border-green-500 bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 dark:text-green-400 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-green-500/50 hover:bg-green-500/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {option === 'ai-suggest' && (
                  <Bot size={16} className={setting === option ? 'text-[#f45a4e]' : 'text-blue-500'} />
                )}
                {option === 'ai-automated' && (
                  <Sparkles size={16} className={setting === option ? 'text-[#f45a4e]' : 'text-green-500'} />
                )}
                {option === 'manual' && (
                  <MessageSquare size={16} className={setting === option ? 'text-[#f45a4e]' : 'text-gray-500'} />
                )}
                <span className="text-sm font-medium">
                  {option === 'ai-suggest' && 'AI Suggest + Approval'}
                  {option === 'ai-automated' && 'AI Fully Automated'}
                  {option === 'manual' && 'Manual Only'}
                </span>
              </div>
              {setting === option && (
                <CheckCircle size={16} className="ml-auto text-green-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
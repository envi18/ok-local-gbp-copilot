// src/components/ui/AutomationTestControls.tsx
// Interactive controls for testing automation scenarios with mock data

import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from './Badge';
import { Card } from './Card';

interface AutomationAction {
  id: string;
  type: 'review' | 'post' | 'response' | 'insight';
  title: string;
  description: string;
  status: 'idle' | 'running' | 'success' | 'error';
  timestamp?: Date;
  result?: string;
}

export const AutomationTestControls: React.FC = () => {
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Simulate automation action
  const triggerAction = async (
    type: 'review' | 'post' | 'response' | 'insight',
    title: string,
    description: string
  ) => {
    const actionId = `action-${Date.now()}`;
    
    // Add action to list as running
    const newAction: AutomationAction = {
      id: actionId,
      type,
      title,
      description,
      status: 'running',
      timestamp: new Date()
    };
    
    setActions(prev => [newAction, ...prev]);
    setActiveAction(actionId);
    
    // Simulate processing time (2-4 seconds)
    const processingTime = 2000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Update action to success
    setActions(prev => prev.map(action => 
      action.id === actionId 
        ? { 
            ...action, 
            status: 'success',
            result: getSuccessMessage(type)
          }
        : action
    ));
    
    setActiveAction(null);
    
    // Clear action after 10 seconds
    setTimeout(() => {
      setActions(prev => prev.filter(action => action.id !== actionId));
    }, 10000);
  };

  const getSuccessMessage = (type: string): string => {
    const messages = {
      review: 'New 5-star review generated and added to location',
      post: 'Test post published to Google Business Profile',
      response: 'Automated response generated and posted',
      insight: 'Performance insights refreshed and analyzed'
    };
    return messages[type as keyof typeof messages] || 'Action completed successfully';
  };

  const getActionIcon = (type: string) => {
    const icons = {
      review: Star,
      post: FileText,
      response: MessageSquare,
      insight: TrendingUp
    };
    const Icon = icons[type as keyof typeof icons] || Zap;
    return Icon;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock size={16} className="animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Automation Test Controls
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Trigger test scenarios to verify automation functionality
            </p>
          </div>
          <Badge variant="gradient" size="sm">
            Mock Mode
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Generate Test Review */}
          <button
            onClick={() => triggerAction(
              'review',
              'Generate Test Review',
              'Creates a new 5-star review from a mock customer'
            )}
            disabled={!!activeAction}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
              hover:border-[#f45a4e] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Star size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Generate Test Review
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Creates a new mock customer review
                </p>
              </div>
            </div>
          </button>

          {/* Trigger Auto-Response */}
          <button
            onClick={() => triggerAction(
              'response',
              'Trigger Auto-Response',
              'Generates and posts an automated review response'
            )}
            disabled={!!activeAction}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
              hover:border-[#f45a4e] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Trigger Auto-Response
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Simulates automated review response
                </p>
              </div>
            </div>
          </button>

          {/* Create Test Post */}
          <button
            onClick={() => triggerAction(
              'post',
              'Create Test Post',
              'Publishes a test post to Google Business Profile'
            )}
            disabled={!!activeAction}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
              hover:border-[#f45a4e] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <FileText size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Create Test Post
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Publishes a mock GBP post
                </p>
              </div>
            </div>
          </button>

          {/* Refresh Insights */}
          <button
            onClick={() => triggerAction(
              'insight',
              'Refresh Insights',
              'Updates performance metrics and analytics'
            )}
            disabled={!!activeAction}
            className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
              hover:border-[#f45a4e] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed group text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Refresh Insights
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Updates performance analytics
                </p>
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* Action History */}
      {actions.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Action History
          </h3>
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = getActionIcon(action.type);
              return (
                <div
                  key={action.id}
                  className={`p-4 rounded-lg border ${
                    action.status === 'running' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : action.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon size={20} className="text-gray-600 dark:text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {action.title}
                          </p>
                          {getStatusIcon(action.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {action.description}
                        </p>
                        {action.result && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                            ✓ {action.result}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {action.timestamp?.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
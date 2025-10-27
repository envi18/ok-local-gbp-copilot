// NotificationDropdown.tsx - Top Menu Notification System
import { AlertCircle, Bell, CheckCircle, MessageSquare, Star, X } from 'lucide-react';
import React from 'react';

export interface AppNotification {
  id: string;
  type: 'review' | 'question' | 'automation' | 'alert' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationDropdownProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll
}) => {
  if (!isOpen) return null;

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Format relative time
  const formatRelativeTime = (isoString: string): string => {
    const now = Date.now();
    const time = new Date(isoString).getTime();
    const diff = now - time;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Get icon and color by notification type
  const getNotificationStyle = (type: AppNotification['type']): { icon: any; bgColor: string; iconColor: string } => {
    switch (type) {
      case 'review':
        return { 
          icon: Star, 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', 
          iconColor: 'text-yellow-600 dark:text-yellow-400' 
        };
      case 'question':
        return { 
          icon: MessageSquare, 
          bgColor: 'bg-blue-100 dark:bg-blue-900/30', 
          iconColor: 'text-blue-600 dark:text-blue-400' 
        };
      case 'automation':
        return { 
          icon: CheckCircle, 
          bgColor: 'bg-green-100 dark:bg-green-900/30', 
          iconColor: 'text-green-600 dark:text-green-400' 
        };
      case 'alert':
        return { 
          icon: AlertCircle, 
          bgColor: 'bg-red-100 dark:bg-red-900/30', 
          iconColor: 'text-red-600 dark:text-red-400' 
        };
      case 'success':
        return { 
          icon: CheckCircle, 
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', 
          iconColor: 'text-emerald-600 dark:text-emerald-400' 
        };
      default:
        return { 
          icon: Bell, 
          bgColor: 'bg-gray-100 dark:bg-gray-900/30', 
          iconColor: 'text-gray-600 dark:text-gray-400' 
        };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={20} />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-center">
                No notifications yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                You'll see new reviews, questions, and automation updates here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const Icon = style.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 ${style.bgColor} rounded-full flex items-center justify-center`}>
                        <Icon size={20} className={style.iconColor} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">
                            View details →
                          </button>
                        )}
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
};
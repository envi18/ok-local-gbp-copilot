// DebugLogPanel.tsx - Backend Debug Log Visualization
import { ChevronDown, ChevronUp, Settings, Trash2, Zap } from 'lucide-react';
import React, { useState } from 'react';
import type { SyncLog, SyncStatus } from '../../lib/reviewAutomationService';
import { SYNC_INTERVAL_PRODUCTION } from '../../lib/reviewAutomationService';

interface DebugLogPanelProps {
  syncStatus: SyncStatus;
  logs: SyncLog[];
  onForceSyncNow: () => void;
  onChangeInterval: (intervalMs: number) => void;
  onClearLogs: () => void;
}

export const DebugLogPanel: React.FC<DebugLogPanelProps> = ({
  syncStatus,
  logs,
  onForceSyncNow,
  onChangeInterval,
  onClearLogs
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showIntervalSelector, setShowIntervalSelector] = useState<boolean>(false);

  // Format timestamp for display
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  // Format relative time
  const formatRelativeTime = (isoString: string | null): string => {
    if (!isoString) return 'Never';
    
    const now = Date.now();
    const time = new Date(isoString).getTime();
    const diff = Math.abs(now - time);
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (seconds > 0) {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Format time until next sync
  const formatTimeUntil = (isoString: string | null): string => {
    if (!isoString) return 'Unknown';
    
    const now = Date.now();
    const time = new Date(isoString).getTime();
    const diff = time - now;
    
    if (diff < 0) return 'Now';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get log icon and color by type
  const getLogStyle = (type: SyncLog['type']): { icon: string; color: string } => {
    switch (type) {
      case 'sync':
        return { icon: '🔄', color: 'text-blue-600 dark:text-blue-400' };
      case 'review':
        return { icon: '📥', color: 'text-purple-600 dark:text-purple-400' };
      case 'automation':
        return { icon: '🤖', color: 'text-green-600 dark:text-green-400' };
      case 'error':
        return { icon: '❌', color: 'text-red-600 dark:text-red-400' };
      case 'info':
        return { icon: '📊', color: 'text-gray-600 dark:text-gray-400' };
      default:
        return { icon: 'ℹ️', color: 'text-gray-600 dark:text-gray-400' };
    }
  };

  // Format interval for display
  const formatInterval = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  };

  // Get recent sync history
  const getSyncHistory = (): SyncLog[] => {
    return logs.filter(log => log.type === 'sync').slice(0, 5);
  };

  return (
    <div className="border-t-4 border-orange-500 bg-gray-50 dark:bg-gray-900 mt-8">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔧 Backend Debug Log
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            (Production Simulation Mode)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Sync Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              📡 Sync Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Sync</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {syncStatus.lastSync ? formatRelativeTime(syncStatus.lastSync) : 'Never'}
                </p>
                {syncStatus.lastSync && (
                  <p className="text-xs text-gray-400">
                    {formatTime(syncStatus.lastSync)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Next Sync</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  In {formatTimeUntil(syncStatus.nextSync)}
                </p>
                {syncStatus.nextSync && (
                  <p className="text-xs text-gray-400">
                    {formatTime(syncStatus.nextSync)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Sync Interval</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  Every {formatInterval(syncStatus.interval)}
                </p>
                <p className="text-xs text-gray-400">
                  {syncStatus.isRunning ? '✅ Running' : '⏸️ Stopped'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              📊 Recent Activity
              <span className="text-xs font-normal text-gray-500">
                (Last {logs.length} events)
              </span>
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No activity yet. Waiting for first sync...
                </p>
              ) : (
                logs.slice(0, 20).map((log) => {
                  const style = getLogStyle(log.type);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 text-sm py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded"
                    >
                      <span className="flex-shrink-0">{style.icon}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 w-20">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className={`${style.color} flex-1`}>
                        {log.message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sync History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              🕒 Sync History
              <span className="text-xs font-normal text-gray-500">
                (Last 5 syncs)
              </span>
            </h4>
            <div className="space-y-2">
              {getSyncHistory().length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No syncs performed yet
                </p>
              ) : (
                getSyncHistory().map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-2 text-sm py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded"
                  >
                    <span className="text-xs text-gray-400 w-20">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Total Syncs:</strong> {syncStatus.totalSyncs}
                {' • '}
                <strong>Pending Reviews:</strong> {syncStatus.pendingReviews}
              </p>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              ⚙️ Demo Controls
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onForceSyncNow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Zap size={16} />
                Force Sync Now
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowIntervalSelector(!showIntervalSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Settings size={16} />
                  Change Interval
                </button>
                
                {showIntervalSelector && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-10 min-w-[200px]">
                    <button
                      onClick={() => {
                        onChangeInterval(30 * 1000); // 30 seconds
                        setShowIntervalSelector(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      ⚡ 30 seconds (Demo)
                    </button>
                    <button
                      onClick={() => {
                        onChangeInterval(2 * 60 * 1000); // 2 minutes
                        setShowIntervalSelector(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      🧪 2 minutes (Testing)
                    </button>
                    <button
                      onClick={() => {
                        onChangeInterval(SYNC_INTERVAL_PRODUCTION); // 2 hours
                        setShowIntervalSelector(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      🏭 2 hours (Production)
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={onClearLogs}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                Clear Log
              </button>
            </div>
            
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              💡 <strong>Tip:</strong> Use "Force Sync Now" to test automation immediately, or change the interval to speed up demos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
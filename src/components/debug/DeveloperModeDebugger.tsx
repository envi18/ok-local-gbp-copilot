// src/components/debug/DeveloperModeDebugger.tsx
// Debug component to help identify developer mode issues

import { AlertCircle, Bug, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDeveloperMode } from '../../hooks/useDeveloperMode';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const DeveloperModeDebugger: React.FC = () => {
  const { isDeveloperMode, developerRole, setRole, clearDeveloperMode } = useDeveloperMode();
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<any>({});
  
  useEffect(() => {
    // Check localStorage directly
    const stored = localStorage.getItem('developer-role');
    setLocalStorageValue(stored);
    
    // Get environment info
    setEnvironmentInfo({
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      hostname: window.location.hostname,
      href: window.location.href,
    });
  }, [developerRole]);

  const testRoleChange = (role: 'user' | 'manager' | 'admin') => {
    console.log(`🧪 Testing role change to: ${role}`);
    setRole(role);
    
    // Force a re-check after a short delay
    setTimeout(() => {
      const newStored = localStorage.getItem('developer-role');
      setLocalStorageValue(newStored);
      console.log(`📁 localStorage after change: ${newStored}`);
    }, 100);
  };

  const clearAndRefresh = () => {
    clearDeveloperMode();
    localStorage.removeItem('developer-role');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="fixed top-20 right-4 w-96 z-50">
      <Card>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <Bug size={18} />
            <span className="font-medium">Developer Mode Debugger</span>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Environment Info */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Environment</h4>
            <div className="space-y-1 text-xs">
              <div>DEV Mode: <Badge variant={environmentInfo.isDev ? 'success' : 'error'} size="sm">
                {environmentInfo.isDev ? 'Yes' : 'No'}
              </Badge></div>
              <div>Vite Mode: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{environmentInfo.mode}</code></div>
              <div>Hostname: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{environmentInfo.hostname}</code></div>
            </div>
          </div>

          {/* Developer Mode State */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Developer Mode State</h4>
            <div className="space-y-1 text-xs">
              <div>isDeveloperMode: <Badge variant={isDeveloperMode ? 'success' : 'error'} size="sm">
                {isDeveloperMode ? 'True' : 'False'}
              </Badge></div>
              <div>developerRole: <Badge variant={developerRole ? 'info' : 'error'} size="sm">
                {developerRole || 'null'}
              </Badge></div>
              <div>localStorage: <Badge variant={localStorageValue ? 'info' : 'error'} size="sm">
                {localStorageValue || 'null'}
              </Badge></div>
            </div>
          </div>

          {/* Quick Role Tests */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Role Tests</h4>
            <div className="flex gap-2 mb-2">
              <Button
                variant={developerRole === 'user' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => testRoleChange('user')}
              >
                User
              </Button>
              <Button
                variant={developerRole === 'manager' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => testRoleChange('manager')}
              >
                Manager
              </Button>
              <Button
                variant={developerRole === 'admin' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => testRoleChange('admin')}
              >
                Admin
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDeveloperMode}
              className="w-full"
            >
              Clear Override
            </Button>
          </div>

          {/* Troubleshooting Actions */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Troubleshooting</h4>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🔍 Developer Mode Debug Info:');
                  console.log('isDeveloperMode:', isDeveloperMode);
                  console.log('developerRole:', developerRole);
                  console.log('localStorage value:', localStorage.getItem('developer-role'));
                  console.log('Environment:', environmentInfo);
                }}
                className="w-full justify-start"
              >
                Log Debug Info to Console
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAndRefresh}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RefreshCw size={14} className="mr-2" />
                Clear All & Refresh Page
              </Button>
            </div>
          </div>

          {/* Issues Detection */}
          {!isDeveloperMode && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium text-sm">Issue Detected</span>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300">
                Developer mode is not active. Make sure you're on localhost or in development mode.
              </p>
            </div>
          )}

          {isDeveloperMode && !developerRole && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium text-sm">No Role Override</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Developer mode is active but no role override is set. Click a role button above to test.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
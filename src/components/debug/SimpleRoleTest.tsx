// src/components/debug/SimpleRoleTest.tsx
// Simple component to test role switching

import React from 'react';
import { useDeveloperMode } from '../../hooks/useDeveloperMode';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const SimpleRoleTest: React.FC = () => {
  const { isDeveloperMode, developerRole, setRole, clearDeveloperMode } = useDeveloperMode();

  // If not in developer mode, don't show anything
  if (!isDeveloperMode) {
    return (
      <Card className="m-4">
        <div className="p-4">
          <p className="text-red-600">Developer mode is not active. Are you on localhost?</p>
          <p className="text-sm text-gray-600 mt-2">
            Current hostname: {window.location.hostname}
          </p>
          <p className="text-sm text-gray-600">
            DEV mode: {import.meta.env.DEV ? 'Yes' : 'No'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Role Testing</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Current State:</p>
            <div className="flex gap-2 items-center">
              <span>Developer Mode:</span>
              <Badge variant={isDeveloperMode ? 'success' : 'error'} size="sm">
                {isDeveloperMode ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2 items-center mt-1">
              <span>Current Role:</span>
              <Badge variant="info" size="sm">
                {developerRole || 'No override (using real role)'}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Role Controls:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={developerRole === 'user' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  console.log('🔄 Setting role to user');
                  setRole('user');
                }}
              >
                Set User
              </Button>
              <Button
                variant={developerRole === 'manager' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  console.log('🔄 Setting role to manager');
                  setRole('manager');
                }}
              >
                Set Manager
              </Button>
              <Button
                variant={developerRole === 'admin' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  console.log('🔄 Setting role to admin');
                  setRole('admin');
                }}
              >
                Set Admin
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🧹 Clearing developer role');
                  clearDeveloperMode();
                }}
              >
                Clear Override
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Debug Info:</p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono">
              <div>isDeveloperMode: {JSON.stringify(isDeveloperMode)}</div>
              <div>developerRole: {JSON.stringify(developerRole)}</div>
              <div>localStorage: {JSON.stringify(localStorage.getItem('developer-role'))}</div>
              <div>hostname: {window.location.hostname}</div>
              <div>DEV: {JSON.stringify(import.meta.env.DEV)}</div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Quick Actions:</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🔍 Debug info logged to console');
                  console.log({
                    isDeveloperMode,
                    developerRole,
                    localStorage: localStorage.getItem('developer-role'),
                    env: import.meta.env,
                  });
                }}
              >
                Log Debug Info
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-red-600 hover:text-red-700"
              >
                Clear & Reload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
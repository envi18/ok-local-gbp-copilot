// src/components/ui/LoginAsBanner.tsx
// Banner shown when admin is logged in as a customer

import { AlertTriangle, LogOut } from 'lucide-react';
import React, { useState } from 'react';
import { LoginAsService } from '../../lib/loginAsService';
import { Button } from './Button';

interface LoginAsBannerProps {
  targetUserEmail: string;
  originalUserEmail: string;
}

export const LoginAsBanner: React.FC<LoginAsBannerProps> = ({
  targetUserEmail,
  originalUserEmail
}) => {
  const [ending, setEnding] = useState(false);

  const handleEndSession = async () => {
    setEnding(true);
    await LoginAsService.endLoginAsSession();
    // Page will reload, so no need to set ending back to false
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                You are currently viewing this account as: <span className="font-bold">{targetUserEmail}</span>
              </p>
              <p className="text-xs opacity-90">
                Admin: {originalUserEmail}
              </p>
            </div>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEndSession}
            disabled={ending}
            className="bg-white text-orange-600 hover:bg-gray-100"
          >
            {ending ? (
              <>
                <LogOut size={14} className="mr-2 animate-spin" />
                Ending...
              </>
            ) : (
              <>
                <LogOut size={14} className="mr-2" />
                Return to Admin
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
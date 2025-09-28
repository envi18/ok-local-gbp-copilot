// src/components/ui/PermissionValidationUI.tsx
// Fixed version with proper TypeScript types

import { AlertTriangle, CheckCircle, ExternalLink, RefreshCw, Shield, XCircle } from 'lucide-react';
import React from 'react';
import { googleAuthService } from '../../lib/googleAuth';

// Properly typed inline UI Components
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  size: 'sm' | 'md';
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ variant, size, children }) => {
  const variantClasses: Record<string, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
  };
  
  const sizeClasses: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', onClick, disabled = false, children }) => {
  const variantClasses: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white hover:from-[#e53e3e] hover:to-[#d73027] shadow-lg',
    secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  };
  
  const sizeClasses: Record<string, string> = {
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

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6 ${className}`}>
    {children}
  </div>
);

interface PermissionValidationProps {
  connected: boolean;
  loading: boolean;
  validating: boolean;
  error: string | null;
  permissionStatus: {
    isValid: boolean;
    missingPermissions: string[];
    grantedScopes: string[];
    errors: string[];
  } | null;
  onConnect: () => void;
  onRetry: () => void;
  onDisconnect: () => void;
}

export const PermissionValidationUI: React.FC<PermissionValidationProps> = ({
  connected,
  loading,
  validating,
  error,
  permissionStatus,
  onRetry,
  onDisconnect
}) => {
  const handleConnect = () => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
    }
  };

  // Permission descriptions for user-friendly display
  const permissionDescriptions: Record<string, string> = {
    'https://www.googleapis.com/auth/business.manage': 'Manage your Google Business Profile (required for posting, review responses, and location updates)',
    'https://www.googleapis.com/auth/userinfo.email': 'Access your email address for account linking',
    'https://www.googleapis.com/auth/userinfo.profile': 'Access basic profile information'
  };

  // Loading state
  if (loading || validating) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {validating ? 'Validating permissions...' : 'Checking Google connection...'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <XCircle className="text-red-500 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">Connection Error</h3>
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">{error}</p>
            <div className="flex gap-3">
              <Button onClick={onRetry} variant="secondary" size="sm" disabled={false}>
                <RefreshCw size={14} className="mr-2" />
                Retry
              </Button>
              <Button onClick={handleConnect} variant="primary" size="sm" disabled={false}>
                <ExternalLink size={14} className="mr-2" />
                Reconnect to Google
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Permission validation failed
  if (connected && permissionStatus && !permissionStatus.isValid) {
    return (
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-amber-800 dark:text-amber-200 font-medium mb-2">
              Insufficient Permissions
            </h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm mb-4">
              Your Google Business Profile connection is missing required permissions. 
              Our automation features need full access to manage your business profile effectively.
            </p>

            {permissionStatus.missingPermissions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-amber-800 dark:text-amber-200 font-medium text-sm mb-2">
                  Missing Permissions:
                </h4>
                <ul className="space-y-2">
                  {permissionStatus.missingPermissions.map((permission, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-amber-800 dark:text-amber-200 font-medium">
                          {permission.split('/').pop()?.replace('.', ' ').toUpperCase()}
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs">
                          {permissionDescriptions[permission] || 'Required for automation features'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {permissionStatus.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-red-800 dark:text-red-200 font-medium text-sm mb-1">
                  API Access Errors:
                </h4>
                <ul className="text-red-700 dark:text-red-300 text-xs space-y-1">
                  {permissionStatus.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
              <h4 className="text-blue-800 dark:text-blue-200 font-medium text-sm mb-2">
                What you need to do:
              </h4>
              <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>1. Click "Reconnect to Google" below</li>
                <li>2. When prompted, check ALL permission boxes</li>
                <li>3. Make sure to grant "Manage Google Business Profile" access</li>
                <li>4. Complete the authorization process</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button onClick={onDisconnect} variant="ghost" size="sm" disabled={false}>
                Cancel Connection
              </Button>
              <Button onClick={handleConnect} variant="primary" size="sm" disabled={false}>
                <ExternalLink size={14} className="mr-2" />
                Reconnect with Full Permissions
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Successfully connected with valid permissions
  if (connected && permissionStatus?.isValid) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-500 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-green-800 dark:text-green-200 font-medium mb-2">
              Google Business Profile Connected
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm mb-4">
              All required permissions granted. Your automation features are ready to use.
            </p>

            <div className="mb-4">
              <h4 className="text-green-800 dark:text-green-200 font-medium text-sm mb-2">
                Granted Permissions:
              </h4>
              <div className="flex flex-wrap gap-2">
                {permissionStatus.grantedScopes.map((scope, index) => (
                  <Badge key={index} variant="success" size="sm">
                    <CheckCircle size={12} className="mr-1" />
                    {scope.split('/').pop()?.replace('.', ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onRetry} variant="secondary" size="sm" disabled={false}>
                <RefreshCw size={14} className="mr-2" />
                Refresh Status
              </Button>
              <Button onClick={onDisconnect} variant="ghost" size="sm" disabled={false}>
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Not connected - initial state
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Shield className="text-gray-400 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-2">
            Connect Google Business Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Connect your Google Business Profile to enable automated review responses, 
            post scheduling, and location management.
          </p>

          <div className="mb-4">
            <h4 className="text-gray-800 dark:text-gray-200 font-medium text-sm mb-2">
              Required Permissions:
            </h4>
            <ul className="space-y-2">
              {Object.entries(permissionDescriptions).map(([scope, description], index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Shield size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {scope.split('/').pop()?.replace('.', ' ').toUpperCase()}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Important:</strong> Make sure to grant ALL permissions during the authorization process. 
              Skipping any permission will prevent automation features from working properly.
            </p>
          </div>

          <Button onClick={handleConnect} variant="primary" size="md" disabled={false}>
            <ExternalLink size={16} className="mr-2" />
            Connect Google Business Profile
          </Button>
        </div>
      </div>
    </Card>
  );
};
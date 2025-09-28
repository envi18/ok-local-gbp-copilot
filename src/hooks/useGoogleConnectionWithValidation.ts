// src/hooks/useGoogleConnectionWithValidation.ts
import { useCallback, useEffect, useState } from 'react';
import { googleAuthService } from '../lib/googleAuth';
import { googlePermissionValidator } from '../lib/googlePermissionValidator';

interface ConnectionState {
  connected: boolean;
  loading: boolean;
  validating: boolean;
  error: string | null;
  tokenData: any;
  permissionStatus: {
    isValid: boolean;
    missingPermissions: string[];
    grantedScopes: string[];
    errors: string[];
  } | null;
}

export const useGoogleConnectionWithValidation = (userId: string | null) => {
  const [state, setState] = useState<ConnectionState>({
    connected: false,
    loading: true,
    validating: false,
    error: null,
    tokenData: null,
    permissionStatus: null
  });

  /**
   * Check connection status and validate permissions
   */
  const checkConnectionAndValidate = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false, connected: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Check if user has active OAuth tokens
      const connectionStatus = await googleAuthService.checkConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          connected: false, 
          tokenData: null,
          permissionStatus: null 
        }));
        return;
      }

      // If connected, validate permissions
      setState(prev => ({ ...prev, validating: true }));
      const permissionStatus = await googlePermissionValidator.validatePermissions(userId);

      if (!permissionStatus.isValid) {
        // Clear invalid connection
        await googlePermissionValidator.clearInvalidConnection(userId);
        
        setState(prev => ({
          ...prev,
          loading: false,
          validating: false,
          connected: false,
          tokenData: null,
          permissionStatus,
          error: 'Insufficient permissions. Please reconnect and grant all required permissions.'
        }));
        return;
      }

      // Connection is valid and has proper permissions
      setState(prev => ({
        ...prev,
        loading: false,
        validating: false,
        connected: true,
        tokenData: connectionStatus.tokenData,
        permissionStatus,
        error: null
      }));

    } catch (error) {
      console.error('Connection validation error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        validating: false,
        error: error instanceof Error ? error.message : 'Connection validation failed'
      }));
    }
  }, [userId]);

  /**
   * Handle OAuth callback and validate permissions
   */
  const handleOAuthCallback = useCallback(async (code: string) => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Exchange code for tokens
      await googleAuthService.exchangeCodeForTokens(code, userId);

      // Wait a moment for tokens to be stored
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate permissions immediately after OAuth
      setState(prev => ({ ...prev, validating: true }));
      const permissionStatus = await googlePermissionValidator.validatePermissions(userId);

      if (!permissionStatus.isValid) {
        // Clear the connection since permissions are insufficient
        await googlePermissionValidator.clearInvalidConnection(userId);
        
        setState(prev => ({
          ...prev,
          loading: false,
          validating: false,
          connected: false,
          tokenData: null,
          permissionStatus,
          error: 'Required permissions not granted. Please try again and approve all permissions.'
        }));
        return;
      }

      // Success - connection valid with proper permissions
      await checkConnectionAndValidate();

    } catch (error) {
      console.error('OAuth callback error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        validating: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed'
      }));
    }
  }, [userId, checkConnectionAndValidate]);

  /**
   * Disconnect from Google
   */
  const disconnect = useCallback(async () => {
    if (!userId) return false;

    try {
      await googlePermissionValidator.clearInvalidConnection(userId);
      setState(prev => ({
        ...prev,
        connected: false,
        tokenData: null,
        permissionStatus: null,
        error: null
      }));
      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to disconnect'
      }));
      return false;
    }
  }, [userId]);

  /**
   * Retry connection with permission validation
   */
  const retryConnection = useCallback(() => {
    checkConnectionAndValidate();
  }, [checkConnectionAndValidate]);

  // Check connection on mount and user change
  useEffect(() => {
    checkConnectionAndValidate();
  }, [checkConnectionAndValidate]);

  // Monitor URL for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setState(prev => ({
        ...prev,
        error: `OAuth error: ${error}`,
        loading: false
      }));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && userId) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [userId, handleOAuthCallback]);

  return {
    connected: state.connected,
    loading: state.loading,
    validating: state.validating,
    error: state.error,
    tokenData: state.tokenData,
    permissionStatus: state.permissionStatus,
    disconnect,
    refresh: checkConnectionAndValidate,
    retry: retryConnection
  };
};
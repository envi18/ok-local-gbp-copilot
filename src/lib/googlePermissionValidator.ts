// src/lib/googlePermissionValidator.ts
import { supabase } from './supabase';

interface PermissionCheck {
  scope: string;
  required: boolean;
  description: string;
  testEndpoint?: string;
}

interface ValidationResult {
  isValid: boolean;
  missingPermissions: string[];
  grantedScopes: string[];
  errors: string[];
}

export class GooglePermissionValidator {
  private readonly requiredPermissions: PermissionCheck[] = [
    {
      scope: 'https://www.googleapis.com/auth/business.manage',
      required: true,
      description: 'Manage Google Business Profile locations, posts, and reviews',
      testEndpoint: '/accounts'
    },
    {
      scope: 'https://www.googleapis.com/auth/userinfo.email',
      required: true,
      description: 'Access user email for account linking',
      testEndpoint: '/userinfo'
    },
    {
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
      required: true,
      description: 'Access basic profile information',
      testEndpoint: '/userinfo'
    }
  ];

  /**
   * Validate all required permissions after OAuth completion
   */
  async validatePermissions(userId: string): Promise<ValidationResult> {
    try {
      // Get the stored token data
      const tokenData = await this.getStoredTokenData(userId);
      if (!tokenData) {
        return {
          isValid: false,
          missingPermissions: this.requiredPermissions.map(p => p.scope),
          grantedScopes: [],
          errors: ['No OAuth token found']
        };
      }

      // Check granted scopes against required permissions
      const grantedScopes = tokenData.scope ? tokenData.scope.split(' ') : [];
      const missingPermissions: string[] = [];
      const errors: string[] = [];

      // Validate each required permission
      for (const permission of this.requiredPermissions) {
        if (permission.required && !grantedScopes.includes(permission.scope)) {
          missingPermissions.push(permission.scope);
        }
      }

      // Test actual API access for critical permissions
      const apiTestResults = await this.testApiAccess(userId);
      errors.push(...apiTestResults.errors);

      const isValid = missingPermissions.length === 0 && errors.length === 0;

      return {
        isValid,
        missingPermissions,
        grantedScopes,
        errors
      };
    } catch (error) {
      console.error('Permission validation error:', error);
      return {
        isValid: false,
        missingPermissions: this.requiredPermissions.map(p => p.scope),
        grantedScopes: [],
        errors: [error instanceof Error ? error.message : 'Permission validation failed']
      };
    }
  }

  /**
   * Test actual API access by making test calls
   */
  private async testApiAccess(userId: string): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    try {
      // Test Google Business Profile API access
      const businessTestResult = await this.testBusinessProfileAccess(userId);
      if (!businessTestResult.success) {
        errors.push(`Google Business Profile API access denied: ${businessTestResult.error}`);
      }

      // Test user info access
      const userInfoResult = await this.testUserInfoAccess(userId);
      if (!userInfoResult.success) {
        errors.push(`User info access denied: ${userInfoResult.error}`);
      }

    } catch (error) {
      errors.push(`API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { errors };
  }

  /**
   * Test Google Business Profile API access
   */
  private async testBusinessProfileAccess(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/.netlify/functions/google-business-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          endpoint: '/accounts',
          method: 'GET'
        })
      });

      if (response.status === 403) {
        return { 
          success: false, 
          error: 'Google Business Profile management permission not granted' 
        };
      }

      if (response.status === 429) {
        // This is expected during approval process
        return { success: true };
      }

      return { success: response.ok };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Business Profile API test failed' 
      };
    }
  }

  /**
   * Test user info API access
   */
  private async testUserInfoAccess(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/.netlify/functions/google-business-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          endpoint: '/userinfo',
          method: 'GET',
          useOAuth2: true // Use OAuth2 API instead of Business Profile API
        })
      });

      if (response.status === 403) {
        return { 
          success: false, 
          error: 'User profile access permission not granted' 
        };
      }

      return { success: response.ok };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'User info API test failed' 
      };
    }
  }

  /**
   * Get stored token data from database
   */
  private async getStoredTokenData(userId: string) {
    const { data, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching token data:', error);
      return null;
    }

    return data;
  }

  /**
   * Clear invalid OAuth tokens and connection
   */
  async clearInvalidConnection(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('google_oauth_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing invalid connection:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error clearing connection:', error);
      return false;
    }
  }

  /**
   * Get user-friendly permission descriptions
   */
  getPermissionDescriptions(): { [scope: string]: string } {
    return this.requiredPermissions.reduce((acc, permission) => {
      acc[permission.scope] = permission.description;
      return acc;
    }, {} as { [scope: string]: string });
  }
}

// Export singleton instance
export const googlePermissionValidator = new GooglePermissionValidator();
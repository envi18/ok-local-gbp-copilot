// src/components/pages/FixProfile.tsx
import React, { useState } from 'react';
import { UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

export const FixProfile: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'fixing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const fixProfileOrganization = async () => {
    setStatus('fixing');
    setMessage('Updating your profile organization...');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update profile to link to OK Local Demo organization (the one with location data)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          organization_id: '6e534b35-532e-40e7-82ce-24a8c5f7b642' // OK Local Demo
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setStatus('success');
      setMessage('Profile updated successfully! You should now see location data in your dashboard.');

    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Fix Profile Organization
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your profile is linked to the wrong organization. Click below to fix this.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              Issue Detected
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your profile is linked to "Demo Organization" but your location data is in "OK Local Demo". 
              This prevents you from seeing your business data.
            </p>
          </div>

          <Button
            onClick={fixProfileOrganization}
            disabled={status === 'fixing'}
            className="w-full py-3"
          >
            <UserCheck size={20} className="mr-2" />
            {status === 'fixing' ? 'Fixing...' : 'Fix Profile Organization'}
          </Button>

          {message && (
            <div className={`p-3 rounded-lg ${
              status === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-2">
                {status === 'success' && <CheckCircle size={16} className="text-green-500" />}
                {status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                <p className={`text-sm ${
                  status === 'success' ? 'text-green-800 dark:text-green-200' :
                  status === 'error' ? 'text-red-800 dark:text-red-200' :
                  'text-blue-800 dark:text-blue-200'
                }`}>
                  {message}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

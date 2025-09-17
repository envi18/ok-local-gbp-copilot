// src/components/pages/DatabaseCheck.tsx
import React, { useState } from 'react';
import { Database, Search, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

export const DatabaseCheck: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fixingProfile, setFixingProfile] = useState(false);
  const [fixMessage, setFixMessage] = useState('');

  const checkDatabase = async () => {
    setLoading(true);
    const checks: any = {};

    try {
      // Check organizations
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*');
      
      checks.organizations = {
        success: !orgError,
        count: orgs?.length || 0,
        data: orgs,
        error: orgError?.message
      };

      // Check profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
      
      checks.profiles = {
        success: !profileError,
        count: profiles?.length || 0,
        data: profiles,
        error: profileError?.message
      };

      // Check locations
      const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('*');
      
      checks.locations = {
        success: !locError,
        count: locations?.length || 0,
        data: locations,
        error: locError?.message
      };

      // Check reviews
      const { data: reviews, error: reviewError } = await supabase
        .from('reviews')
        .select('*');
      
      checks.reviews = {
        success: !reviewError,
        count: reviews?.length || 0,
        data: reviews,
        error: reviewError?.message
      };

      // Check posts
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('*');
      
      checks.posts = {
        success: !postError,
        count: posts?.length || 0,
        data: posts,
        error: postError?.message
      };

      // Check current user
      const { data: { user } } = await supabase.auth.getUser();
      checks.currentUser = { data: user };

      setResults(checks);

    } catch (error) {
      console.error('Database check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixProfileOrganization = async () => {
    setFixingProfile(true);
    setFixMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Update profile to link to OK Local Demo organization
      const { error } = await supabase
        .from('profiles')
        .update({ 
          organization_id: '6e534b35-532e-40e7-82ce-24a8c5f7b642' // OK Local Demo
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setFixMessage('✅ Profile updated! You should now see location data. Refresh your dashboard.');
      
      // Refresh the database check
      await checkDatabase();

    } catch (error) {
      setFixMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setFixingProfile(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Database Status Check
        </h1>
        <div className="flex gap-3 justify-center">
          <Button onClick={checkDatabase} loading={loading}>
            <Search size={16} />
            Check Database Contents
          </Button>
          <Button 
            onClick={fixProfileOrganization} 
            loading={fixingProfile}
            variant="secondary"
          >
            <UserCheck size={16} />
            Fix Profile Organization
          </Button>
        </div>
        
        {fixMessage && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">{fixMessage}</p>
          </div>
        )}
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(results).map(([table, data]: [string, any]) => (
            <Card key={table}>
              <div className="flex items-center gap-2 mb-4">
                {data.success ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <AlertCircle className="text-red-500" size={20} />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {table}
                </h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {data.success ? 'Connected' : 'Error'}
                </p>
                
                {data.count !== undefined && (
                  <p>
                    <span className="font-medium">Records:</span> {data.count}
                  </p>
                )}
                
                {data.error && (
                  <p className="text-red-600 dark:text-red-400">
                    <span className="font-medium">Error:</span> {data.error}
                  </p>
                )}
                
                {data.data && data.data.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">View Data</summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                      {JSON.stringify(data.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

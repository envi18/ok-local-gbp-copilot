// src/components/pages/SampleDataManager.tsx
import { AlertTriangle, CheckCircle, Database, MapPin, Package, RefreshCw, Users } from 'lucide-react';
import React, { useState } from 'react';
import { insertEnhancedSampleData, runEnhancedSampleDataInsertion } from '../../lib/insertSampleData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const SampleDataManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState('');

  const handleInsertSampleData = async (force: boolean = false) => {
    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const insertionResult = await insertEnhancedSampleData({ 
        force, 
        verbose: true 
      });
      
      setResult(insertionResult);
      
      if (insertionResult.success) {
        if (insertionResult.skipped) {
          setMessage('✅ Sample data already exists. Use "Force Recreate" to recreate data.');
        } else {
          setMessage('🎉 Enhanced sample data created successfully!');
        }
      } else {
        setMessage(`❌ Failed to create sample data: ${insertionResult.error}`);
      }
    } catch (error) {
      console.error('Error inserting sample data:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRun = async () => {
    setLoading(true);
    setMessage('');
    setResult(null);

    try {
      const insertionResult = await runEnhancedSampleDataInsertion();
      setResult(insertionResult);
      
      if (insertionResult.success) {
        setMessage('🎉 Sample data ready for development!');
      } else {
        setMessage(`❌ Failed: ${insertionResult.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sample Data Manager
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create comprehensive sample data for development and testing. This will populate your database 
          with realistic organizations, users, locations, and product access data.
        </p>
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleQuickRun}
            loading={loading}
            variant="primary"
            className="flex-1"
          >
            <Database className="h-4 w-4 mr-2" />
            Create Sample Data
          </Button>
          
          <Button
            onClick={() => handleInsertSampleData(false)}
            loading={loading}
            variant="secondary"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check & Update
          </Button>
          
          <Button
            onClick={() => handleInsertSampleData(true)}
            loading={loading}
            variant="ghost"
            className="flex-1"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Force Recreate
          </Button>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
          </div>
        )}
      </Card>

      {/* Sample Data Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          What Gets Created
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">6 Organizations</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Different plan tiers</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">9 User Profiles</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Admin, Manager, Customer</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">7 Locations</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Various business types</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">4 Products</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">With access assignments</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <CheckCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Reviews & Posts</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">If tables exist</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Database className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">AI Data</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sample reports</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Results
          </h2>
          
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Sample data creation completed!
                </span>
              </div>
              
              {result.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="font-bold text-green-800 dark:text-green-200">
                      {result.summary.organizations}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">Organizations</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="font-bold text-blue-800 dark:text-blue-200">
                      {result.summary.profiles}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Profiles</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <div className="font-bold text-purple-800 dark:text-purple-200">
                      {result.summary.locations}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Locations</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <div className="font-bold text-orange-800 dark:text-orange-200">
                      {result.summary.productAccess}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Product Access</div>
                  </div>
                </div>
              )}
              
              {result.skipped && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <Badge variant="warning" size="sm" className="mb-2">Skipped</Badge>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Sample data already exists. Use "Force Recreate" if you want to recreate all data.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-200 font-medium">
                  Sample data creation failed
                </span>
              </div>
              
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                  {result.error?.toString() || 'Unknown error'}
                </pre>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Test Users Info */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Test User Accounts
        </h2>
        
        <p className="text-blue-800 dark:text-blue-200 mb-4 text-sm">
          The following test user profiles will be created for testing different role permissions:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <Badge variant="error" size="sm" className="mb-1">Admin</Badge>
            <div className="font-medium text-gray-900 dark:text-white">Admin User</div>
            <div className="text-gray-600 dark:text-gray-400">admin@oklocalapp.com</div>
          </div>
          
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <Badge variant="warning" size="sm" className="mb-1">Manager</Badge>
            <div className="font-medium text-gray-900 dark:text-white">Mike Manager</div>
            <div className="text-gray-600 dark:text-gray-400">mike@downtowncoffee.com</div>
          </div>
          
          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
            <Badge variant="info" size="sm" className="mb-1">Customer</Badge>
            <div className="font-medium text-gray-900 dark:text-white">Emma Davis</div>
            <div className="text-gray-600 dark:text-gray-400">emma@downtowncoffee.com</div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> These are sample profiles with predetermined IDs for testing. 
          Real user authentication will still use your actual OAuth account.
        </div>
      </Card>
    </div>
  );
};
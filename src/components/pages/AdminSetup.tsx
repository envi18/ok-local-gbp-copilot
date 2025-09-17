// src/components/pages/AdminSetup.tsx
import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader, Play } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { initializeDatabase } from '../../lib/initializeDatabase';

export const AdminSetup: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const handleInitializeDatabase = async () => {
    setStatus('running');
    setMessage('Initializing database...');
    setLogs(['Starting database initialization...']);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const logMessage = args.join(' ');
      setLogs(prev => [...prev, `[INFO] ${logMessage}`]);
      originalLog(...args);
    };

    console.error = (...args) => {
      const logMessage = args.join(' ');
      setLogs(prev => [...prev, `[ERROR] ${logMessage}`]);
      originalError(...args);
    };

    console.warn = (...args) => {
      const logMessage = args.join(' ');
      setLogs(prev => [...prev, `[WARN] ${logMessage}`]);
      originalWarn(...args);
    };

    try {
      const result = await initializeDatabase();
      
      if (result.success) {
        setStatus('success');
        setMessage('Database initialized successfully! You can now use real data throughout the application.');
        setLogs(prev => [...prev, '[SUCCESS] Database initialization completed!']);
      } else {
        setStatus('error');
        setMessage(`Database initialization failed: ${result.error?.message || 'Unknown error'}`);
        setLogs(prev => [...prev, `[ERROR] Initialization failed: ${result.error?.message}`]);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLogs(prev => [...prev, `[ERROR] Unexpected error: ${error}`]);
    } finally {
      // Restore console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader className="animate-spin text-blue-500" size={24} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={24} />;
      default:
        return <Database className="text-gray-500" size={24} />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Badge variant="info">Running</Badge>;
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="warning">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
          Database Setup
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Initialize your Supabase database with the required schema and sample data
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Database Status
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {message || 'Ready to initialize database schema and sample data'}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              What this will do:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Create database tables (organizations, profiles, locations, reviews, posts)</li>
              <li>• Set up Row Level Security (RLS) policies for data protection</li>
              <li>• Insert sample data for testing (3 demo locations, reviews, posts)</li>
              <li>• Enable your application to use real database storage</li>
            </ul>
          </div>

          <Button
            onClick={handleInitializeDatabase}
            disabled={status === 'running'}
            className="w-full py-3 text-base"
            size="lg"
          >
            {status === 'running' ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Initializing Database...
              </>
            ) : (
              <>
                <Play size={20} className="mr-2" />
                Initialize Database
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Logs Card */}
      {logs.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Initialization Logs
          </h3>
          <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="font-mono text-sm space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('[ERROR]')
                      ? 'text-red-400'
                      : log.includes('[WARN]')
                      ? 'text-yellow-400'
                      : log.includes('[SUCCESS]')
                      ? 'text-green-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Success Instructions */}
      {status === 'success' && (
        <Card>
          <div className="text-center py-6">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Database Ready!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your application is now connected to a real database with sample data.
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>✅ Database schema created successfully</p>
              <p>✅ Sample data inserted (3 locations, reviews, posts)</p>
              <p>✅ Your user profile linked to demo organization</p>
              <p>✅ Row Level Security policies active</p>
            </div>
          </div>
        </Card>
      )}

      {/* Error Instructions */}
      {status === 'error' && (
        <Card>
          <div className="text-center py-6">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Initialization Error
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              There was an issue initializing the database. Check the logs above for details.
            </p>
            <Button
              onClick={handleInitializeDatabase}
              variant="secondary"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

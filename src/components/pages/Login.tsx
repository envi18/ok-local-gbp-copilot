import React, { useState } from 'react';
import { Shield, Brain, MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('demo@acmecorp.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
        } else if (data.user) {
          onLogin(data.user);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: 'Demo',
              last_name: 'User'
            }
          }
        });

        if (authError) {
          setError(authError.message);
        } else if (data.user) {
          setError('Check your email for the confirmation link!');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const FeatureCard: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
  }> = ({ icon: Icon, title, description, gradient }) => (
    <Card hover className="group">
      <div className="text-center">
        <div className={`inline-flex p-4 rounded-full ${gradient} mb-4 transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0f0f23] dark:via-[#1a1a2e] dark:to-[#16213e] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-r from-[#f45a4e]/10 to-[#e53e3e]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-4 -right-4 w-96 h-96 bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-[#11998e]/10 to-[#38ef7d]/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 grid lg:grid-cols-2 min-h-screen">
        {/* Left side - Features and branding */}
        <div className="flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-lg">
            <div className="flex items-center mb-8">
              <img
                src={theme === 'light' ? '/LOGO.png' : '/logodrk.png'}
                alt="OK Local GBP Copilot"
                className="h-12 w-auto"
              />
            </div>

            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                The Future of<br />
                <span className="bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                  Local Marketing
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Manage multiple Google Business Profiles with AI-powered automation, 
                comprehensive analytics, and enterprise-grade security.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard
                icon={Shield}
                title="Enterprise Security"
                description="Bank-level encryption with SOC 2 compliance"
                gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
              />
              <FeatureCard
                icon={Brain}
                title="AI-Powered"
                description="Automated insights and smart recommendations"
                gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
              />
              <FeatureCard
                icon={MapPin}
                title="Multi-Location"
                description="Centralized management for all your locations"
                gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
              />
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-md mx-auto w-full">
            <Card className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {mode === 'signin' 
                    ? 'Sign in to your account to continue' 
                    : 'Create a new account to get started'
                  }
                </p>
              </div>

              {error && (
                <div className={`mb-4 p-3 rounded-lg ${
                  error.includes('Check your email') 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                }`}>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 text-base"
                  loading={loading}
                  disabled={loading}
                >
                  {loading 
                    ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                    : (mode === 'signin' ? 'Sign In' : 'Create Account')
                  }
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError('');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors"
                >
                  {mode === 'signin' 
                    ? "Don't have an account? Create one" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>

              <Card className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Badge variant="info" size="sm">Demo</Badge>
                  Quick Start
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="mb-1">Create an account with any email to test the platform.</p>
                  <p className="text-xs">Default credentials are prefilled for convenience.</p>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};


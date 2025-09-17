import React from 'react';
import { Heart, Shield, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../contexts/ThemeContext';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/20 dark:border-white/10">
      <div className="bg-white/50 dark:bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center">
                <img
                  src={theme === 'light' ? '/LOGO.png' : '/logodrk.png'}
                  alt="OK Local GBP Copilot"
                  className="h-6 lg:h-8 w-auto"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                The future of local marketing. Manage multiple Google Business Profiles with AI-powered automation and enterprise-grade security.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" size="sm">SOC 2 Compliant</Badge>
                <Badge variant="gradient" size="sm">Enterprise Ready</Badge>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Location Management
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Review Management
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Automation Tools
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Analytics & Reports
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Video Tutorials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                    System Status
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail size={14} />
                  <span>support@oklocal.com</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={14} />
                  <span>1-800-OK-LOCAL</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={14} />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe size={14} />
                  <span>oklocal.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-white/20 dark:border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>© {currentYear} OK Local. All rights reserved.</span>
                <div className="hidden md:flex items-center gap-1">
                  <span>Made with</span>
                  <Heart size={14} className="text-[#f45a4e] fill-current" />
                  <span>for local businesses</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6 text-sm">
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] transition-colors">
                  Cookie Policy
                </a>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Shield size={14} />
                  <span>SOC 2 Type II</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
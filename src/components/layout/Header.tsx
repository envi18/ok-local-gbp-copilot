import React, { useState } from 'react';
import { Search, Bell, Settings, Sun, Moon, ChevronDown, Menu, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  user: User;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMobileMenuToggle, 
  isMobileMenuOpen, 
  user, 
  onLogout 
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Extract user information
  const userEmail = user.email || 'No email';
  const userName = user.user_metadata?.first_name && user.user_metadata?.last_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user.user_metadata?.full_name || userEmail.split('@')[0];

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/40 backdrop-blur-md border-b border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-3 lg:gap-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          {/* Logo */}
          <div className="flex items-center">
            <img
              src={theme === 'light' ? '/LOGO.png' : '/logodrk.png'}
              alt="OK Local GBP Copilot"
              className="h-8 lg:h-10 w-auto"
            />
          </div>

          {/* Organization Switcher */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-black/30 backdrop-blur-sm rounded-lg border border-white/30 dark:border-white/20">
            <span className="text-sm font-medium text-gray-900 dark:text-white hidden md:inline">Demo Org</span>
            <Badge variant="gradient" size="sm">Pro</Badge>
            <ChevronDown size={14} className="text-gray-500 hidden md:inline" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search Bar */}
          <div className="relative hidden lg:block">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            />
          </div>

          {/* Mobile Search Button */}
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Search size={18} />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] rounded-full text-white text-xs flex items-center justify-center">
                3
              </span>
            </Button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="transition-transform duration-300"
          >
            {theme === 'light' ? (
              <Moon size={18} className="transition-transform duration-300 rotate-0" />
            ) : (
              <Sun size={18} className="transition-transform duration-300 rotate-180" />
            )}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Settings size={18} />
          </Button>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/20 dark:hover:bg-black/30 transition-colors min-w-[44px] min-h-[44px] justify-center"
            >
              <div className="relative">
                {/* Generate avatar from user initials */}
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] flex items-center justify-center text-white text-sm font-medium">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-48 bg-white/90 dark:bg-black/80 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-2 shadow-xl z-50">
                <div className="px-3 py-2 border-b border-white/20 dark:border-white/10">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{userEmail}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mt-1 min-h-[44px] flex items-center transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

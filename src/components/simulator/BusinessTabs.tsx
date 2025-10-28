// src/components/simulator/BusinessTabs.tsx
// Google-style horizontal tabs (Overview, Menu, Reviews)

import React from 'react';

export type TabType = 'overview' | 'menu' | 'reviews';

interface BusinessTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BusinessTabs: React.FC<BusinessTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'menu', label: 'Menu' },
    { id: 'reviews', label: 'Reviews' }
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
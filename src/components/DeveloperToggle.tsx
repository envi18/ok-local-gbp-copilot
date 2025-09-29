import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Code, Crown, Settings, Shield, User, X } from 'lucide-react';
import React, { useState } from 'react';
import { useDeveloperMode } from '../hooks/useDeveloperMode';

interface DeveloperToggleProps {
  currentUser: SupabaseUser;
  currentRole: string;
}

const DeveloperToggle: React.FC<DeveloperToggleProps> = ({ currentUser, currentRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDeveloperMode, developerRole, setRole, clearDeveloperMode } = useDeveloperMode();

  if (!isDeveloperMode) return null;

  const roles = [
    { value: 'user', label: 'Customer User', icon: User, color: 'text-blue-500' },
    { value: 'manager', label: 'Manager', icon: Shield, color: 'text-green-500' },
    { value: 'admin', label: 'Admin', icon: Crown, color: 'text-purple-500' }
  ] as const;

  const activeRole = developerRole || currentRole;
  const activeRoleData = roles.find(role => role.value === activeRole);

  return (
    <div className="fixed bottom-4 left-4 z-40 lg:left-80">
      <div className="bg-red-500 text-white px-3 py-1 rounded-t-md text-xs font-bold flex items-center gap-1">
        <Code size={12} />
        DEVELOPER MODE
        {developerRole && (
          <button
            onClick={clearDeveloperMode}
            className="ml-2 hover:bg-red-600 rounded px-1"
            title="Clear developer override"
          >
            <X size={12} />
          </button>
        )}
      </div>
      
      <div className="relative bg-white border border-red-500 rounded-b-md shadow-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          {activeRoleData && (
            <>
              <activeRoleData.icon size={18} className={activeRoleData.color} />
              <div className="text-left">
                <div className="font-medium text-gray-900">
                  {activeRoleData.label}
                  {developerRole && <span className="text-red-500 ml-1">(Override)</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {developerRole ? `Overriding as ${activeRole}` : `Real role: ${currentRole}`}
                </div>
              </div>
            </>
          )}
          <Settings size={16} className="ml-auto text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg overflow-hidden">
            {/* Option to use real role */}
            <button
              onClick={() => {
                clearDeveloperMode();
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                !developerRole ? 'bg-green-50 border-l-4 border-green-500' : ''
              }`}
            >
              <User size={18} className="text-gray-500" />
              <div>
                <div className="font-medium text-gray-900">Use Real Role</div>
                <div className="text-xs text-gray-500">Your actual role: {currentRole}</div>
                <div className="text-xs text-gray-400">User: {currentUser.email}</div>
              </div>
              {!developerRole && (
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>

            <div className="border-t border-gray-200"></div>

            {/* Developer role options */}
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => {
                  setRole(role.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                  developerRole === role.value ? 'bg-red-50 border-l-4 border-red-500' : ''
                }`}
              >
                <role.icon size={18} className={role.color} />
                <div>
                  <div className="font-medium text-gray-900">{role.label}</div>
                  <div className="text-xs text-gray-500">Override as {role.value}</div>
                </div>
                {developerRole === role.value && (
                  <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperToggle;
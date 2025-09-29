// src/hooks/useDeveloperMode.ts
import { useEffect, useState } from 'react';

export const useDeveloperMode = () => {
  const [developerRole, setDeveloperRole] = useState<'user' | 'manager' | 'admin' | null>(null);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    const devMode = import.meta.env.DEV || window.location.hostname === 'localhost';
    setIsDeveloperMode(devMode);
    
    // Load saved developer role from localStorage
    if (devMode) {
      const savedRole = localStorage.getItem('developer-role') as 'user' | 'manager' | 'admin' | null;
      setDeveloperRole(savedRole);
    }
  }, []);

  const setRole = (role: 'user' | 'manager' | 'admin' | null) => {
    setDeveloperRole(role);
    if (role) {
      localStorage.setItem('developer-role', role);
    } else {
      localStorage.removeItem('developer-role');
    }
  };

  const clearDeveloperMode = () => {
    setRole(null);
  };

  return {
    isDeveloperMode,
    developerRole,
    setRole,
    clearDeveloperMode
  };
};
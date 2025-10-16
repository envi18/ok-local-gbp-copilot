// src/AppWrapper.tsx
// Wrapper to handle public share routes before main App

import React, { useEffect } from 'react';
import App from './App';
import { PublicReportShare } from './components/pages/PublicReportShare';

export const AppWrapper: React.FC = () => {
  // Check if current URL is a public share route
  const isPublicShareRoute = window.location.pathname.startsWith('/share/report/');

  // Force light theme for public share routes
  useEffect(() => {
    if (isPublicShareRoute) {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isPublicShareRoute]);

  // If it's a public share route, render that directly (no ThemeProvider wrapper)
  if (isPublicShareRoute) {
    return <PublicReportShare />;
  }

  // Otherwise, render the normal app
  return <App />;
};
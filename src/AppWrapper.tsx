// src/AppWrapper.tsx
// Wrapper to handle public share routes before main App

import React from 'react';
import App from './App';
import { PublicReportShare } from './components/pages/PublicReportShare';
import { ThemeProvider } from './contexts/ThemeContext';

export const AppWrapper: React.FC = () => {
  // Check if current URL is a public share route
  const isPublicShareRoute = window.location.pathname.startsWith('/share/report/');

  // If it's a public share route, render that directly
  if (isPublicShareRoute) {
    return (
      <ThemeProvider>
        <PublicReportShare />
      </ThemeProvider>
    );
  }

  // Otherwise, render the normal app
  return <App />;
};
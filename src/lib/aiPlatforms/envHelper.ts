// src/lib/aiPlatforms/envHelper.ts
// Helper to get environment variables in both browser and Node.js

/**
 * Get environment variable that works in both Vite (browser) and Node.js
 */
export function getEnv(key: string): string | undefined {
  // Try process.env first (Node.js / tsx)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Try import.meta.env (Vite / browser)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  
  return undefined;
}
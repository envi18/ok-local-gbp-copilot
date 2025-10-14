// src/config/featureFlags.ts
// Feature flag system for enabling/disabling functionality

/**
 * Feature Flags Configuration
 * Controls which data sources and features are active
 */
export const FEATURE_FLAGS = {
  /**
   * Use mock Google Business data instead of real API
   * Set to true during development while waiting for Google API access
   */
  USE_MOCK_GOOGLE_DATA: import.meta.env.VITE_USE_MOCK_GOOGLE_DATA === 'true',
  
  /**
   * Enable real Google Business Profile API calls
   * Set to true once Google approves API access
   */
  GOOGLE_API_ENABLED: import.meta.env.VITE_GOOGLE_API_ENABLED === 'true',
  
  /**
   * Show debug information in development
   * Displays which data source is being used
   */
  DEBUG_MODE: import.meta.env.DEV,
  
  /**
   * Simulate API delays for realistic testing
   * Adds artificial delays to mock responses
   */
  SIMULATE_API_DELAYS: import.meta.env.VITE_SIMULATE_API_DELAYS !== 'false',
};

/**
 * API Configuration
 * Controls timeout and retry behavior
 */
export const API_CONFIG = {
  /**
   * Mock API delay range (milliseconds)
   * Simulates realistic API response times
   */
  MOCK_API_DELAY_MIN: 300,
  MOCK_API_DELAY_MAX: 800,
  
  /**
   * Real API timeout (milliseconds)
   */
  REAL_API_TIMEOUT: 10000,
  
  /**
   * Number of retries for failed requests
   */
  MAX_RETRIES: 3,
};

/**
 * Helper function to get random delay for mock API calls
 */
export function getMockApiDelay(): number {
  if (!FEATURE_FLAGS.SIMULATE_API_DELAYS) return 0;
  
  const min = API_CONFIG.MOCK_API_DELAY_MIN;
  const max = API_CONFIG.MOCK_API_DELAY_MAX;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Helper function to log data source in debug mode
 */
export function logDataSource(source: 'mock' | 'api', operation: string): void {
  if (FEATURE_FLAGS.DEBUG_MODE) {
    const emoji = source === 'mock' ? '🎭' : '🌐';
    const color = source === 'mock' ? '#f093fb' : '#11998e';
    console.log(
      `%c${emoji} ${operation} %c[${source.toUpperCase()}]`,
      'color: #667eea; font-weight: bold',
      `color: ${color}; font-weight: bold`
    );
  }
}

/**
 * Get current configuration status
 */
export function getConfigStatus() {
  return {
    dataSource: FEATURE_FLAGS.USE_MOCK_GOOGLE_DATA ? 'Mock Data' : 'Google API',
    apiEnabled: FEATURE_FLAGS.GOOGLE_API_ENABLED,
    debugMode: FEATURE_FLAGS.DEBUG_MODE,
    simulateDelays: FEATURE_FLAGS.SIMULATE_API_DELAYS,
  };
}

/**
 * Type guard to check if we should use mock data
 */
export function shouldUseMockData(): boolean {
  return FEATURE_FLAGS.USE_MOCK_GOOGLE_DATA;
}

/**
 * Type guard to check if Google API is enabled
 */
export function isGoogleApiEnabled(): boolean {
  return FEATURE_FLAGS.GOOGLE_API_ENABLED && !FEATURE_FLAGS.USE_MOCK_GOOGLE_DATA;
}
// railway-backend/routes/health.js
// Health check endpoint for monitoring

import { createClient } from '@supabase/supabase-js';
import express from 'express';

const router = express.Router();

// Initialize Supabase client for health checks
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /health
 * Returns server health status and connectivity checks
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  // Check Supabase connectivity
  try {
    const { data, error } = await supabase
      .from('ai_visibility_external_reports')
      .select('id')
      .limit(1);
    
    healthStatus.services.supabase = {
      status: error ? 'unhealthy' : 'healthy',
      responseTime: Date.now() - startTime,
      error: error?.message
    };
  } catch (error) {
    healthStatus.services.supabase = {
      status: 'unhealthy',
      error: error.message
    };
    healthStatus.status = 'degraded';
  }

  // Check API keys presence (don't expose actual keys)
  healthStatus.services.apiKeys = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    scrapingbee: !!process.env.SCRAPINGBEE_API_KEY,
    googleSearch: !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  };

  // Memory usage
  const memUsage = process.memoryUsage();
  healthStatus.memory = {
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
  };

  // Overall health check
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
});

export { router as healthCheckRoute };

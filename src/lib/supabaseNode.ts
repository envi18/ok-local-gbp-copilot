// src/lib/supabaseNode.ts
// Node.js-compatible Supabase client (for testing)

import { createClient } from '@supabase/supabase-js';

// Get environment variables from process.env (Node.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
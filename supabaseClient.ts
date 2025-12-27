import { createClient } from '@supabase/supabase-js';

// Note: In a real Next.js app, these would be process.env.NEXT_PUBLIC_SUPABASE_URL
// For this environment, we check if they exist, otherwise we fallback to mock mode in the API service.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
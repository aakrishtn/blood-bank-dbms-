import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a server-side Supabase client (non-cookie version)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    }
  });
}

// Alias for createServerSupabaseClient for backward compatibility
export const createClient = createServerSupabaseClient;

// Simple direct Supabase client for admin operations
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined, falling back to anon key');
    return createSupabaseClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
} 
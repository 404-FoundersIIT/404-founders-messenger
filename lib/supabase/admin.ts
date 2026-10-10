import { createClient } from '@supabase/supabase-js';

// Server-only administrative client
export function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.includes('placeholder')) {
    // Return null or standard client when service role key isn't set yet
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

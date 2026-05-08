import { createClient } from '@supabase/supabase-js';

// Prefer service_role key for server writes; anon key works when RLS is disabled.
export function getSupabaseServiceClient() {
  const url = process.env['SUPABASE_URL'];
  const key =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ??
    process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

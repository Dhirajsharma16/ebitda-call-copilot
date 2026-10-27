// Frontend Supabase helper for optional client-side direct access.
// IMPORTANT SECURITY: ONLY the public anon key is read here.
// NEVER put the service_role key into NEXT_PUBLIC_* variables.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    // Dynamically require or create if needed
    return null;
  } catch {
    return null;
  }
}

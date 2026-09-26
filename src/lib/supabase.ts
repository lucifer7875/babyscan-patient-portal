import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.',
  )
}

/** Storage bucket holding the report files. Override with VITE_SUPABASE_BUCKET. */
export const REPORTS_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET ?? 'patient-reports'

/** Origin of the Supabase project, used to build the connect-src CSP directive. */
export const SUPABASE_ORIGIN = new URL(url).origin

/**
 * Anonymous, read-only client. No auth session is kept: patients are verified
 * by the RPC, not by a login, and we never persist a token in the browser.
 */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

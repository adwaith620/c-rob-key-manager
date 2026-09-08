import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const anonKey = (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ??
  import.meta.env['VITE_SUPABASE_ANON_KEY']) as string | undefined;

/** True once the project's Supabase credentials are present. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase browser client. When credentials are not yet configured the client
 * is null so the UI can render a clear "connect your project" state instead of
 * crashing.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export const COLLEGE_EMAIL_DOMAIN = "@tkmce.ac.in";

export function isCollegeEmail(email: string) {
  return email.trim().toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN);
}

/** Turns Supabase/Postgres errors into friendly inline form messages. */
export function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("tkmce.ac.in") || m.includes("restricted to")) {
    return `Registration is restricted to ${COLLEGE_EMAIL_DOMAIN} email addresses.`;
  }
  if (m.includes("database error saving new user")) {
    return `Registration is restricted to ${COLLEGE_EMAIL_DOMAIN} email addresses.`;
  }
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (m.includes("email not confirmed")) {
    return "Please verify your email address before signing in.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with this email already exists.";
  }
  return message;
}

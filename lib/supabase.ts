import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Create a per-request Supabase client using the service role key.
 * The service role key bypasses Row Level Security.
 * This file is server-only — never import from client code.
 */
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

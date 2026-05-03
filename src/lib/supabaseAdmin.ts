import { createClient } from "@supabase/supabase-js";

const supabaseStorageBucket =
  process.env.SUPABASE_STORAGE_BUCKET || "product-images";

function validateSupabaseUrl(supabaseUrl: string) {
  try {
    const parsed = new URL(supabaseUrl);

    if (!parsed.hostname.endsWith(".supabase.co")) {
      throw new Error();
    }

    if (parsed.pathname.includes("/storage/") || parsed.pathname.includes("/storage/v1/s3")) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "SUPABASE_URL must be the project URL like https://<project-ref>.supabase.co, not the Storage S3 endpoint"
    );
  }
}

function validateServiceRoleKey(serviceRoleKey: string) {
  const looksLikeJwt = serviceRoleKey.split(".").length === 3;

  if (!looksLikeJwt) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be the full service_role JWT from Supabase Project Settings > API"
    );
  }
}

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is not set");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  validateSupabaseUrl(supabaseUrl);
  validateServiceRoleKey(supabaseServiceRoleKey);

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const productImageBucket = supabaseStorageBucket;

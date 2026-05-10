export interface AdminPayload {
  id: string;
  email: string;
  username: string;
  name?: string;
}

export const ADMIN_TOKEN_COOKIE = "admin-token";

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production"
);
export interface AdminPayload {
  id: string;
  email: string;
  username: string;
  name?: string;
}

export const ADMIN_TOKEN_COOKIE = "admin-token";
export const ADMIN_AUTH_METHOD = "password+email-otp";

const DEFAULT_ADMIN_TOKEN_VALIDITY = "14d";
const DEFAULT_ADMIN_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function parseAdminTokenValidity(value: string | undefined) {
  if (!value) {
    return { duration: DEFAULT_ADMIN_TOKEN_VALIDITY, maxAgeSeconds: DEFAULT_ADMIN_TOKEN_MAX_AGE_SECONDS };
  }

  const parsed = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!parsed) {
    return { duration: DEFAULT_ADMIN_TOKEN_VALIDITY, maxAgeSeconds: DEFAULT_ADMIN_TOKEN_MAX_AGE_SECONDS };
  }

  const amount = Number(parsed[1]);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { duration: DEFAULT_ADMIN_TOKEN_VALIDITY, maxAgeSeconds: DEFAULT_ADMIN_TOKEN_MAX_AGE_SECONDS };
  }

  const unit = parsed[2].toLowerCase();
  const maxAgeSecondsByUnit = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  } as const;

  return {
    duration: `${amount}${unit}`,
    maxAgeSeconds: amount * maxAgeSecondsByUnit[unit as keyof typeof maxAgeSecondsByUnit],
  };
}

const adminTokenValidity = parseAdminTokenValidity(process.env.ADMIN_TOKEN_VALIDITY);

export const ADMIN_TOKEN_VALIDITY = adminTokenValidity.duration;
export const ADMIN_TOKEN_MAX_AGE_SECONDS = adminTokenValidity.maxAgeSeconds;

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || new TextEncoder().encode(jwtSecret).length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 bytes");
}
export const JWT_SECRET = new TextEncoder().encode(jwtSecret);

export function readAdminTokenPayload(payload: Record<string, unknown>): AdminPayload | null {
  if (payload.authMethod !== ADMIN_AUTH_METHOD || typeof payload.exp !== "number"
    || typeof payload.id !== "string" || !payload.id
    || typeof payload.email !== "string" || !payload.email
    || typeof payload.username !== "string" || !payload.username) return null;
  return {
    id: payload.id,
    email: payload.email,
    username: payload.username,
    ...(typeof payload.name === "string" ? { name: payload.name } : {}),
  };
}

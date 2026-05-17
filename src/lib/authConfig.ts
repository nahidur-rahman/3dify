export interface AdminPayload {
  id: string;
  email: string;
  username: string;
  name?: string;
}

export const ADMIN_TOKEN_COOKIE = "admin-token";

const DEFAULT_ADMIN_TOKEN_VALIDITY = "3d";

function parseAdminTokenValidity(value: string | undefined) {
  if (!value) {
    return { duration: DEFAULT_ADMIN_TOKEN_VALIDITY, maxAgeSeconds: 60 * 60 * 24 * 3 };
  }

  const parsed = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!parsed) {
    return { duration: DEFAULT_ADMIN_TOKEN_VALIDITY, maxAgeSeconds: 60 * 60 * 24 * 3 };
  }

  const amount = Number(parsed[1]);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { duration: DEFAULT_ADMIN_TOKEN_VALIDITY, maxAgeSeconds: 60 * 60 * 24 * 3 };
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

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production"
);
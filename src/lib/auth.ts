import { createHmac } from "crypto";

export const COOKIE_NAME = "vibe_nav_token";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  return process.env.AUTH_SECRET || "vibe-nav-secret-key-2026";
}

/** Create a signed session token (payload.expiry.signature) */
export function createToken(): string {
  const secret = getSecret();
  const payload = `${Date.now() + SESSION_TTL}`;
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${payload}.${signature}`;
}

/** Cookie options for setting the auth cookie */
export function getCookieOptions(): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL / 1000,
  };
}

/** Cookie options for clearing the auth cookie */
export function getClearCookieOptions(): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

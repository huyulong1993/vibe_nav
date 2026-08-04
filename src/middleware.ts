import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "vibe_nav_token";
const WRITE_METHODS = ["POST", "PUT", "DELETE", "PATCH"];
const PROTECTED_API_PREFIXES = ["/api/categories", "/api/bookmarks", "/api/import"];
const ADMIN_PATH = "/admin";
const LOGIN_PATH = "/admin/login";
const AUTH_API = "/api/auth";

/**
 * Verify token using Web Crypto API (compatible with Edge Runtime)
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;

    const secret = process.env.AUTH_SECRET || "vibe-nav-secret-key-2026";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = hexToBytes(signature);
    return crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(expiryStr)
    );
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): ArrayBuffer {
  const buffer = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return buffer;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Allow auth API and login page without check
  if (pathname.startsWith(AUTH_API) || pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  // Check admin page access
  if (pathname.startsWith(ADMIN_PATH)) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check write API access
  if (WRITE_METHODS.includes(method)) {
    const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (isProtectedApi) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (!token || !(await verifyToken(token))) {
        return NextResponse.json(
          { error: "未登录或登录已过期" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

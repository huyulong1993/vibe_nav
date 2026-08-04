import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

// Lightweight check: just verify the cookie exists (middleware handles full validation)
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  // Full validation is done by middleware on protected routes;
  // here we just check presence as a quick client-side status check
  return NextResponse.json({ authenticated: !!token });
}

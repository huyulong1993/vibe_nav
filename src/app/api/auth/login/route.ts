import { NextRequest, NextResponse } from "next/server";
import { createToken, COOKIE_NAME, getCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "请输入密码" }, { status: 400 });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== adminPassword) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const token = createToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, getCookieOptions());

    return response;
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const current = getSettings();

  const updated = {
    site_name: body.site_name ?? current.site_name,
    site_logo: body.site_logo ?? current.site_logo,
    site_favicon: body.site_favicon ?? current.site_favicon,
  };

  saveSettings(updated);
  return NextResponse.json(updated);
}

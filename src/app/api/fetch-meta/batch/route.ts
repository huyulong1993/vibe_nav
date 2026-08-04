import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/fetch-meta/batch
 * Body: { urls: string[], ids?: string[] }  (ids array is optional, maps 1:1 with urls)
 * Returns: array of { id, title, description, favicon, hostname, error? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const urls: string[] = body.urls || [];
    const ids: string[] = body.ids || [];

    if (!urls.length) {
      return NextResponse.json({ error: "请提供 urls 数组" }, { status: 400 });
    }

    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const id = ids[i] || null;

      let normalizedUrl = url.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = "https://" + normalizedUrl;
      }

      try {
        // Call our own meta API
        const origin = request.nextUrl.origin;
        const res = await fetch(
          `${origin}/api/fetch-meta?url=${encodeURIComponent(normalizedUrl)}`
        );
        const data = await res.json();

        if (data.error) {
          results.push({ id, url, error: data.error });
        } else {
          results.push({
            id,
            url,
            title: data.title,
            description: data.description,
            favicon: data.favicon,
            hostname: data.hostname,
            source: data.source,
          });
        }
      } catch (err: any) {
        results.push({ id, url, error: err?.message || "未知错误" });
      }

      // Small delay between requests to avoid rate limiting
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "批量抓取失败" }, { status: 500 });
  }
}

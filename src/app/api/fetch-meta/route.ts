import { NextRequest, NextResponse } from "next/server";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
];

function decode(s: string) {
  return s
    .replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, "/").replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string } | null> {
  // Try up to 3 times with different UAs
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": USER_AGENTS[attempt % USER_AGENTS.length],
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        return { html, finalUrl: res.url || url };
      }

      // If we get a 403/429 etc, try next UA
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }
  return null;
}

function extractMeta(html: string, baseUrl: string) {
  // Title
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) title = decode(titleMatch[1]);

  if (!title) {
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
    if (ogTitle) title = decode(ogTitle[1]);
  }

  // Description
  let description = "";
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (descMatch) description = decode(descMatch[1]);

  if (!description) {
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
    if (ogDesc) description = decode(ogDesc[1]);
  }
  if (description.length > 200) description = description.substring(0, 200) + "...";

  // Favicon
  let favicon = "";
  const patterns = [
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']*)["']/i,
    /<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']*)["']/i,
    /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i,
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m && m[1]) {
      favicon = m[1];
      break;
    }
  }

  // Resolve relative favicon URL
  if (favicon && !favicon.startsWith("http")) {
    try {
      favicon = new URL(favicon, baseUrl).href;
    } catch {
      favicon = `${new URL(baseUrl).origin}${favicon.startsWith("/") ? "" : "/"}${favicon}`;
    }
  }

  // Always provide Google favicon as fallback
  let hostname = "";
  try {
    hostname = new URL(baseUrl).hostname;
  } catch {
    hostname = baseUrl;
  }
  const googleFavicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  return {
    title: title || hostname,
    description,
    favicon: favicon || googleFavicon,
    hostname,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  // Validate and normalize URL
  let normalizedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  try {
    const page = await fetchPage(normalizedUrl);

    if (!page) {
      // Even if fetch fails, we can still provide a favicon via Google
      const hostname = (() => {
        try { return new URL(normalizedUrl).hostname; } catch { return ""; }
      })();
      return NextResponse.json({
        title: hostname,
        description: "",
        favicon: hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` : "",
        hostname,
        source: "fallback",
      });
    }

    const meta = extractMeta(page.html, page.finalUrl);
    return NextResponse.json({ ...meta, source: "fetched" });
  } catch (error: any) {
    return NextResponse.json({ error: "抓取失败: " + (error?.message || "未知错误") }, { status: 502 });
  }
}

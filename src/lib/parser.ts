// Netscape Bookmark HTML Parser
// Parses browser-exported bookmark files

interface ParsedBookmark {
  title: string;
  url: string;
  icon: string;
}

interface ParsedCategory {
  name: string;
  icon: string;
  bookmarks: ParsedBookmark[];
}

interface ParsedResult {
  categories: ParsedCategory[];
}

export function parseBookmarkHTML(html: string): ParsedResult {
  const categories: ParsedCategory[] = [];

  // Find the main Bookmarks folder content
  const mainMatch = html.match(/<DT><H3[^>]*>Bookmarks<\/H3>[\s\S]*?<DL><p>([\s\S]*)<\/DL><p>\s*<\/DL><p>/i);
  if (!mainMatch) {
    return { categories };
  }

  const mainContent = mainMatch[1];

  // Parse all top-level H3 categories (including nested ones)
  const categoryRegex = /<DT><H3[^>]*>(.*?)<\/H3>\s*<DL><p>([\s\S]*?)<\/DL><p>/gi;
  let catMatch: RegExpExecArray | null;

  while ((catMatch = categoryRegex.exec(mainContent)) !== null) {
    const catName = decodeHTMLEntities(catMatch[1].trim());
    const catContent = catMatch[2];

    // Skip empty categories
    if (!catMatch[1].trim()) continue;

    const bookmarks: ParsedBookmark[] = [];

    // Parse bookmarks (A tags)
    const linkRegex = /<DT><A HREF="([^"]*)"[^>]*>(.*?)<\/A>/gi;
    let linkMatch: RegExpExecArray | null;

    while ((linkMatch = linkRegex.exec(catContent)) !== null) {
      bookmarks.push({
        title: decodeHTMLEntities(linkMatch[2].trim()),
        url: linkMatch[1],
        icon: getFaviconUrl(linkMatch[1]),
      });
    }

    // Also check for nested sub-categories (H3 inside this DL)
    const nestedCatRegex = /<DT><H3[^>]*>(.*?)<\/H3>\s*<DL><p>([\s\S]*?)<\/DL><p>/gi;
    let nestedMatch: RegExpExecArray | null;

    while ((nestedMatch = nestedCatRegex.exec(catContent)) !== null) {
      const nestedName = decodeHTMLEntities(nestedMatch[1].trim());
      if (!nestedName) continue;

      const nestedBookmarks: ParsedBookmark[] = [];
      const nestedLinkRegex = /<DT><A HREF="([^"]*)"[^>]*>(.*?)<\/A>/gi;
      let nlMatch: RegExpExecArray | null;

      while ((nlMatch = nestedLinkRegex.exec(nestedMatch[2])) !== null) {
        nestedBookmarks.push({
          title: decodeHTMLEntities(nlMatch[2].trim()),
          url: nlMatch[1],
          icon: getFaviconUrl(nlMatch[1]),
        });
      }

      if (nestedBookmarks.length > 0 || nestedMatch[2].trim() === '') {
        categories.push({
          name: nestedName,
          icon: getCategoryEmoji(nestedName),
          bookmarks: nestedBookmarks,
        });
      }
    }

    if (bookmarks.length > 0) {
      categories.push({
        name: catName,
        icon: getCategoryEmoji(catName),
        bookmarks,
      });
    }
  }

  return { categories };
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;lt;/g, '<')
    .replace(/&amp;gt;/g, '>');
}

function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}

function getCategoryEmoji(name: string): string {
  const map: Record<string, string> = {
    '常用': '⭐',
    '工具': '🔧',
    '游戏': '🎮',
    '开发': '💻',
    '开发工具': '🛠️',
    '视频': '🎬',
    '设计': '🎨',
    '生活': '🏠',
    '音乐': '🎵',
    '学习': '📚',
    '新闻': '📰',
    '社交': '💬',
    '购物': '🛍️',
    '旅行': '✈️',
    '健康': '❤️',
    '科技': '🚀',
    '财经': '💰',
    '政府服务': '🏛️',
    '云存储': '☁️',
  };

  for (const [key, emoji] of Object.entries(map)) {
    if (name.includes(key)) return emoji;
  }
  return '📁';
}

import { NextRequest, NextResponse } from 'next/server';
import { getBookmarks, saveBookmarks, getCategoryById } from '@/lib/db';
import { v4 as uuid } from 'uuid';

const LOG_PREFIX = '[BookmarksAPI]';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');

  let bookmarks = getBookmarks(categoryId || undefined);
  bookmarks.sort((a, b) => a.sort_order - b.sort_order);

  if (categoryId) {
    console.log(`${LOG_PREFIX} GET | category_id="${categoryId}" | 结果数=${bookmarks.length}`);
  } else {
    console.log(`${LOG_PREFIX} GET | 全部书签 | 结果数=${bookmarks.length}`);
  }

  return NextResponse.json(bookmarks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { category_id, title, url, description, icon } = body;

  console.log(`${LOG_PREFIX} POST | title="${title}" url="${url}" category_id="${category_id}"`);

  if (!category_id || !title || !url) {
    console.warn(`${LOG_PREFIX} POST 验证失败 | 缺失字段`);
    return NextResponse.json({ error: '分类、标题和URL不能为空' }, { status: 400 });
  }

  const category = getCategoryById(category_id);
  if (!category) {
    console.warn(`${LOG_PREFIX} POST 验证失败 | 分类不存在 id="${category_id}"`);
    return NextResponse.json({ error: '分类不存在' }, { status: 404 });
  }

  const bookmarks = getBookmarks();
  const catBookmarks = bookmarks.filter((b) => b.category_id === category_id);
  const maxOrder = catBookmarks.length > 0
    ? Math.max(...catBookmarks.map((b) => b.sort_order))
    : 0;

  const now = new Date().toISOString();
  const bookmark = {
    id: uuid(),
    category_id,
    title,
    url,
    description: description || '',
    icon: icon || '',
    sort_order: maxOrder + 1,
    created_at: now,
  };

  bookmarks.push(bookmark);
  saveBookmarks(bookmarks);

  console.log(`${LOG_PREFIX} POST 成功 | id="${bookmark.id}" sort_order=${bookmark.sort_order} | 分类现有书签数=${catBookmarks.length + 1}`);
  return NextResponse.json(bookmark, { status: 201 });
}

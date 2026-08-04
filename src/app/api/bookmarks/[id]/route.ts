import { NextRequest, NextResponse } from 'next/server';
import { getBookmarks, saveBookmarks } from '@/lib/db';

const LOG_PREFIX = '[BookmarksAPI:id]';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`${LOG_PREFIX} PUT | id="${params.id}"`);

  const bookmarks = getBookmarks();
  const idx = bookmarks.findIndex((b) => b.id === params.id);
  if (idx === -1) {
    console.warn(`${LOG_PREFIX} PUT 失败: 书签不存在 id="${params.id}"`);
    return NextResponse.json({ error: '书签不存在' }, { status: 404 });
  }

  const oldBm = bookmarks[idx];
  const body = await request.json();
  const { title, url, description, icon, category_id, sort_order } = body;

  console.log(`${LOG_PREFIX} PUT 变更前 | title="${oldBm.title}" url="${oldBm.url}" category_id="${oldBm.category_id}"`);

  if (title !== undefined) bookmarks[idx].title = title;
  if (url !== undefined) bookmarks[idx].url = url;
  if (description !== undefined) bookmarks[idx].description = description;
  if (icon !== undefined) bookmarks[idx].icon = icon;
  if (category_id !== undefined) bookmarks[idx].category_id = category_id;
  if (sort_order !== undefined) bookmarks[idx].sort_order = sort_order;

  saveBookmarks(bookmarks);

  const newBm = bookmarks[idx];
  console.log(`${LOG_PREFIX} PUT 变更后 | title="${newBm.title}" url="${newBm.url}" category_id="${newBm.category_id}"`);
  console.log(`${LOG_PREFIX} PUT 成功`);
  return NextResponse.json(newBm);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`${LOG_PREFIX} DELETE | id="${params.id}"`);

  let bookmarks = getBookmarks();
  const idx = bookmarks.findIndex((b) => b.id === params.id);
  if (idx === -1) {
    console.warn(`${LOG_PREFIX} DELETE 失败: 书签不存在 id="${params.id}"`);
    return NextResponse.json({ error: '书签不存在' }, { status: 404 });
  }

  const deleted = bookmarks[idx];
  bookmarks = bookmarks.filter((b) => b.id !== params.id);
  saveBookmarks(bookmarks);

  console.log(`${LOG_PREFIX} DELETE 成功 | title="${deleted.title}" url="${deleted.url}" | 剩余书签数=${bookmarks.length}`);
  return NextResponse.json({ success: true });
}

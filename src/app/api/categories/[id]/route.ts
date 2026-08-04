import { NextRequest, NextResponse } from 'next/server';
import { getCategories, saveCategories, getBookmarks, saveBookmarks } from '@/lib/db';

const LOG_PREFIX = '[CategoriesAPI:id]';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`${LOG_PREFIX} PUT | id="${params.id}"`);

  const categories = getCategories();
  const idx = categories.findIndex((c) => c.id === params.id);
  if (idx === -1) {
    console.warn(`${LOG_PREFIX} PUT 失败: 分类不存在 id="${params.id}"`);
    return NextResponse.json({ error: '分类不存在' }, { status: 404 });
  }

  const oldCat = categories[idx];
  const body = await request.json();
  const { name, icon, sort_order } = body;

  console.log(`${LOG_PREFIX} PUT 变更前 | name="${oldCat.name}" icon="${oldCat.icon}"`);

  if (name !== undefined) categories[idx].name = name;
  if (icon !== undefined) categories[idx].icon = icon;
  if (sort_order !== undefined) categories[idx].sort_order = sort_order;
  categories[idx].updated_at = new Date().toISOString();

  saveCategories(categories);

  const newCat = categories[idx];
  console.log(`${LOG_PREFIX} PUT 变更后 | name="${newCat.name}" icon="${newCat.icon}"`);
  console.log(`${LOG_PREFIX} PUT 成功`);
  return NextResponse.json(newCat);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`${LOG_PREFIX} DELETE | id="${params.id}"`);

  let categories = getCategories();
  const idx = categories.findIndex((c) => c.id === params.id);
  if (idx === -1) {
    console.warn(`${LOG_PREFIX} DELETE 失败: 分类不存在 id="${params.id}"`);
    return NextResponse.json({ error: '分类不存在' }, { status: 404 });
  }

  const deletedCat = categories[idx];

  // Remove category and its bookmarks
  const bmsToDelete = getBookmarks().filter((b) => b.category_id === params.id);
  categories = categories.filter((c) => c.id !== params.id);
  saveCategories(categories);

  let bookmarks = getBookmarks();
  bookmarks = bookmarks.filter((b) => b.category_id !== params.id);
  saveBookmarks(bookmarks);

  console.log(`${LOG_PREFIX} DELETE 成功 | name="${deletedCat.name}" | 删除书签数=${bmsToDelete.length} | 剩余分类数=${categories.length}`);
  return NextResponse.json({ success: true });
}

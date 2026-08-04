import { NextRequest, NextResponse } from 'next/server';
import { getCategories, saveCategories, getBookmarks, saveBookmarks } from '@/lib/db';
import { parseBookmarkHTML } from '@/lib/parser';
import { v4 as uuid } from 'uuid';

const LOG_PREFIX = '[ImportAPI]';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`${LOG_PREFIX} ========== 收到导入请求 ==========`);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'replace';

    console.log(`${LOG_PREFIX} 表单解析完成 | mode="${mode}" | file=${file ? `"${file.name}" (${file.size} bytes, type=${file.type})` : "null"}`);

    if (!file) {
      console.warn(`${LOG_PREFIX} 请求中止: 未上传文件`);
      return NextResponse.json({ error: '请上传文件' }, { status: 400 });
    }

    const text = await file.text();
    console.log(`${LOG_PREFIX} 文件读取完成 | 大小=${text.length} 字符 | 耗时=${Date.now() - startTime}ms`);

    const result = await doImport(text, mode);
    console.log(`${LOG_PREFIX} 导入完成 | 总耗时=${Date.now() - startTime}ms`);
    return result;
  } catch (error) {
    console.error(`${LOG_PREFIX} 导入异常 | 耗时=${Date.now() - startTime}ms | error=`, error);
    return NextResponse.json({ error: '导入失败，请检查文件格式' }, { status: 500 });
  }
}

async function doImport(html: string, mode: string) {
  const parseStart = Date.now();

  console.log(`${LOG_PREFIX} 开始解析HTML | mode="${mode}" | HTML大小=${html.length} 字符`);
  const result = parseBookmarkHTML(html);
  console.log(`${LOG_PREFIX} HTML解析完成 | 解析到 ${result.categories.length} 个分类 | 耗时=${Date.now() - parseStart}ms`);

  if (result.categories.length === 0) {
    console.warn(`${LOG_PREFIX} 解析结果为空，未找到任何书签`);
    return NextResponse.json({ error: '未找到任何书签' }, { status: 400 });
  }

  // 输出解析到的所有分类概览
  console.log(`${LOG_PREFIX} ---------- 解析结果概览 ----------`);
  result.categories.forEach((cat, i) => {
    console.log(`${LOG_PREFIX} [${i + 1}] "${cat.name}" | icon="${cat.icon}" | 书签数=${cat.bookmarks.length}`);
  });
  console.log(`${LOG_PREFIX} ----------------------------------`);

  const importStats = { categories: 0, bookmarks: 0, skipped: 0 };
  const now = new Date().toISOString();

  const existingCatsBefore = getCategories();
  const existingBmsBefore = getBookmarks();
  console.log(`${LOG_PREFIX} 当前DB状态 | 分类数=${existingCatsBefore.length} | 书签数=${existingBmsBefore.length}`);

  let categories = mode === 'replace' ? [] : existingCatsBefore;
  let bookmarks = mode === 'replace' ? [] : existingBmsBefore;

  if (mode === 'replace') {
    console.log(`${LOG_PREFIX} 模式=replace，已清空内存中的数据（将在保存时覆盖文件）`);
  }

  const catInsertStart = Date.now();

  for (const cat of result.categories) {
    if (cat.bookmarks.length === 0) {
      importStats.skipped++;
      console.log(`${LOG_PREFIX} 跳过空分类 | "${cat.name}" 无书签`);
      continue;
    }

    let categoryId: string;
    const existingCat = categories.find((c) => c.name === cat.name);

    if (existingCat) {
      categoryId = existingCat.id;
      console.log(`${LOG_PREFIX} 分类已存在 | "${cat.name}" id="${categoryId}"`);
    } else {
      categoryId = uuid();
      const maxOrder = categories.length > 0
        ? Math.max(...categories.map((c) => c.sort_order))
        : 0;
      categories.push({
        id: categoryId,
        name: cat.name,
        icon: cat.icon,
        sort_order: maxOrder + 1,
        created_at: now,
        updated_at: now,
      });
      importStats.categories++;
      console.log(`${LOG_PREFIX} 新建分类 | "${cat.name}" id="${categoryId}" icon="${cat.icon}" sort_order=${maxOrder + 1}`);
    }

    let catBmAdded = 0;
    let catBmSkipped = 0;

    for (const bm of cat.bookmarks) {
      const isDuplicate = bookmarks.some(
        (b) => b.category_id === categoryId && b.url === bm.url
      );
      if (isDuplicate) {
        importStats.skipped++;
        catBmSkipped++;
        if (catBmSkipped <= 3) {
          console.log(`${LOG_PREFIX} 跳过重复书签 | "${bm.title}" url="${bm.url}" (分类="${cat.name}")`);
        }
        continue;
      }

      const catBookmarks = bookmarks.filter((b) => b.category_id === categoryId);
      const maxBmOrder = catBookmarks.length > 0
        ? Math.max(...catBookmarks.map((b) => b.sort_order))
        : 0;

      bookmarks.push({
        id: uuid(),
        category_id: categoryId,
        title: bm.title,
        url: bm.url,
        description: '',
        icon: bm.icon,
        sort_order: maxBmOrder + 1,
        created_at: now,
      });
      importStats.bookmarks++;
      catBmAdded++;
    }

    console.log(`${LOG_PREFIX} 分类处理完成 | "${cat.name}" 新增=${catBmAdded} 跳过=${catBmSkipped} 总计书签=${cat.bookmarks.length}`);
  }

  console.log(`${LOG_PREFIX} 数据组装完成 | 新增分类=${importStats.categories} 新增书签=${importStats.bookmarks} 跳过=${importStats.skipped} | 耗时=${Date.now() - catInsertStart}ms`);

  const saveStart = Date.now();
  saveCategories(categories);
  saveBookmarks(bookmarks);
  console.log(`${LOG_PREFIX} 数据持久化完成 | 分类数=${categories.length} 书签数=${bookmarks.length} | 耗时=${Date.now() - saveStart}ms`);

  return NextResponse.json({
    success: true,
    stats: importStats,
  });
}

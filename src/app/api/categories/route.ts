import { NextRequest, NextResponse } from 'next/server';
import { getCategories, saveCategories } from '@/lib/db';
import { v4 as uuid } from 'uuid';

const LOG_PREFIX = '[CategoriesAPI]';

export async function GET() {
  const categories = getCategories();
  categories.sort((a, b) => a.sort_order - b.sort_order);
  console.log(`${LOG_PREFIX} GET | 结果数=${categories.length}`);
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, icon } = body;

  console.log(`${LOG_PREFIX} POST | name="${name}" icon="${icon}"`);

  if (!name) {
    console.warn(`${LOG_PREFIX} POST 验证失败: 名称为空`);
    return NextResponse.json({ error: '分类名称不能为空' }, { status: 400 });
  }

  const categories = getCategories();
  const maxOrder = categories.length > 0
    ? Math.max(...categories.map((c) => c.sort_order))
    : 0;

  const now = new Date().toISOString();
  const category = {
    id: uuid(),
    name,
    icon: icon || '',
    sort_order: maxOrder + 1,
    created_at: now,
    updated_at: now,
  };

  categories.push(category);
  saveCategories(categories);

  console.log(`${LOG_PREFIX} POST 成功 | id="${category.id}" sort_order=${category.sort_order} | 总分类数=${categories.length}`);
  return NextResponse.json(category, { status: 201 });
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CategoryCard } from "@/components/CategoryCard";
import type { Category, Bookmark } from "@/lib/db";

interface CategoryWithBookmarks extends Category {
  bookmarks: Bookmark[];
}

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryWithBookmarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const catRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const fetchData = async () => {
    try {
      const [catRes, bmRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/bookmarks"),
      ]);
      const cats: Category[] = await catRes.json();
      const bms: Bookmark[] = await bmRes.json();

      const catsWithBms: CategoryWithBookmarks[] = cats.map((cat) => ({
        ...cat,
        bookmarks: bms.filter((bm) => bm.category_id === cat.id),
      }));

      setCategories(catsWithBms);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        bookmarks: cat.bookmarks.filter(
          (bm) =>
            bm.title.toLowerCase().includes(q) ||
            bm.url.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.bookmarks.length > 0 || cat.name.toLowerCase().includes(q));
  }, [categories, search]);

  const scrollToCat = (catId: string) => {
    const el = catRefs.current.get(catId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveCat(catId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="mt-4 text-app-text-muted text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          <span className="gradient-text">个人导航站</span>
        </h1>
        <p className="text-app-text-secondary text-sm max-w-md mx-auto">
          管理你的常用书签，快速访问你需要的网站
        </p>

        {/* Search */}
        <div className="mt-6 max-w-md mx-auto relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索书签..."
            className="w-full glass rounded-xl px-4 py-3 pl-10 text-sm text-app-text placeholder:text-app-text-muted
              border app-border focus:border-accent/50 focus:outline-none transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Navigation Pills */}
      {filtered.length > 0 && !search.trim() && (
        <div className="mb-6 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1 min-w-max">
            {filtered.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCat(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeCat === cat.id
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "bg-app-surface text-app-text-secondary hover:text-app-text hover:bg-app-surface-hover border border-transparent"
                }`}
              >
                <span className="text-base">{cat.icon || "📁"}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {filtered.length > 0 ? (
        <div className="space-y-6">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              ref={(el) => { if (el) catRefs.current.set(cat.id, el); }}
              className="scroll-mt-24"
            >
              <CategoryCard category={cat} bookmarks={cat.bookmarks} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-app-text-secondary mb-2">
            {categories.length === 0 ? "还没有书签" : "未找到匹配的书签"}
          </h2>
          <p className="text-app-text-muted text-sm">
            {categories.length === 0
              ? "点击右上角「管理」按钮进入后台，导入你的书签吧"
              : "尝试其他关键词搜索"}
          </p>
        </div>
      )}
    </div>
  );
}

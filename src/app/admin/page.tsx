"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryForm } from "@/components/CategoryForm";
import { BookmarkForm } from "@/components/BookmarkForm";
import { ImportModal } from "@/components/ImportModal";
import { SettingsForm } from "@/components/SettingsForm";
import type { Category, Bookmark } from "@/lib/db";

const LOG_PREFIX = "[AdminPage]";

interface CategoryWithBookmarks extends Category {
  bookmarks: Bookmark[];
}

export default function AdminPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithBookmarks[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Form states
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [bmFormOpen, setBmFormOpen] = useState(false);
  const [editingBm, setEditingBm] = useState<Bookmark | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, done: 0, failed: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Verify auth on mount
  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/admin/login?from=/admin");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => router.replace("/admin/login?from=/admin"));
  }, [router]);

  const fetchData = useCallback(async () => {
    const startTime = Date.now();
    console.log(`${LOG_PREFIX} 开始加载数据...`);

    try {
      const [catRes, bmRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/bookmarks"),
      ]);

      if (!catRes.ok || !bmRes.ok) {
        console.error(`${LOG_PREFIX} 加载失败 | categories=${catRes.status} bookmarks=${bmRes.status}`);
      }

      const cats: Category[] = await catRes.json();
      const bms: Bookmark[] = await bmRes.json();

      console.log(`${LOG_PREFIX} 数据加载完成 | 分类数=${cats.length} 书签数=${bms.length} | 耗时=${Date.now() - startTime}ms`);

      const catsWithBms: CategoryWithBookmarks[] = cats.map((cat) => ({
        ...cat,
        bookmarks: bms.filter((bm) => bm.category_id === cat.id),
      }));

      setCategories(catsWithBms);
    } catch (err) {
      console.error(`${LOG_PREFIX} 加载数据异常 | error=`, err);
    } finally {
      setLoading(false);
      console.log(`${LOG_PREFIX} 加载完成 | loading=false`);
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      console.log(`${LOG_PREFIX} 页面挂载，首次加载`);
      fetchData();
    }
  }, [authChecked, fetchData]);

  const handleLogout = async () => {
    console.log(`${LOG_PREFIX} 退出登录`);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const handleBatchRecognize = async () => {
    // Collect all bookmarks that need meta data
    const allBms = categories.flatMap((c) => c.bookmarks);
    const needMeta = allBms.filter(
      (bm) => !bm.description || bm.icon.includes("google.com/s2/favicons")
    );

    if (needMeta.length === 0) {
      alert("所有书签已有完整的描述和图标信息");
      return;
    }

    if (!confirm(`找到 ${needMeta.length} 个需要识别的书签，开始批量抓取？`)) return;

    console.log(`${LOG_PREFIX} 批量识别开始 | 总数=${needMeta.length}`);
    setBatchRunning(true);
    setBatchProgress({ current: 0, total: needMeta.length, done: 0, failed: 0 });

    let done = 0;
    let failed = 0;

    for (let i = 0; i < needMeta.length; i++) {
      const bm = needMeta[i];
      setBatchProgress({ current: i + 1, total: needMeta.length, done, failed });

      try {
        const res = await fetch(
          `/api/fetch-meta?url=${encodeURIComponent(bm.url)}`
        );
        const data = await res.json();

        if (data.error) {
          // Still update icon with Google favicon if missing
          if (!bm.icon) {
            const hostname = (() => { try { return new URL(bm.url).hostname; } catch { return ""; } })();
            if (hostname) {
              await fetch(`/api/bookmarks/${bm.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  icon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
                }),
              });
            }
          }
          failed++;
        } else {
          // Update the bookmark with meta
          const update: any = {};
          if (data.title && data.title !== bm.title) update.title = data.title;
          if (data.description) update.description = data.description;
          if (data.favicon) update.icon = data.favicon;

          if (Object.keys(update).length > 0) {
            await fetch(`/api/bookmarks/${bm.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(update),
            });
            done++;
          }
        }
      } catch {
        failed++;
      }
    }

    console.log(`${LOG_PREFIX} 批量识别完成 | 成功=${done} 失败=${failed}`);
    setBatchProgress({ current: needMeta.length, total: needMeta.length, done, failed });

    // Brief delay to show completion, then refresh
    await new Promise((r) => setTimeout(r, 800));
    window.location.reload();
  };

  const handleDeleteCategory = async (cat: Category) => {
    console.log(`${LOG_PREFIX} 删除分类确认 | name="${cat.name}" id="${cat.id}"`);
    if (!confirm(`确定要删除分类「${cat.name}」及其所有书签吗？`)) {
      console.log(`${LOG_PREFIX} 取消删除分类`);
      return;
    }

    const delStart = Date.now();
    console.log(`${LOG_PREFIX} 开始删除分类 | name="${cat.name}" id="${cat.id}"`);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      console.log(`${LOG_PREFIX} 删除分类完成 | status=${res.status} | 耗时=${Date.now() - delStart}ms`);
    } catch (err) {
      console.error(`${LOG_PREFIX} 删除分类异常 | error=`, err);
    }
    fetchData();
  };

  const handleAddBookmark = (cat: Category) => {
    console.log(`${LOG_PREFIX} 新增书签 | category="${cat.name}" id="${cat.id}"`);
    setEditingBm(null);
    setDefaultCategoryId(cat.id);
    setBmFormOpen(true);
  };

  const handleEditBookmark = (bm: Bookmark) => {
    setEditingBm(bm);
    setDefaultCategoryId(undefined);
    setBmFormOpen(true);
  };

  const handleDeleteBookmark = async (bm: Bookmark) => {
    console.log(`${LOG_PREFIX} 删除书签确认 | title="${bm.title}" id="${bm.id}"`);
    if (!confirm(`确定要删除书签「${bm.title}」吗？`)) {
      console.log(`${LOG_PREFIX} 取消删除书签`);
      return;
    }

    const delStart = Date.now();
    console.log(`${LOG_PREFIX} 开始删除书签 | title="${bm.title}" id="${bm.id}"`);
    try {
      const res = await fetch(`/api/bookmarks/${bm.id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      console.log(`${LOG_PREFIX} 删除书签完成 | status=${res.status} | 耗时=${Date.now() - delStart}ms`);
    } catch (err) {
      console.error(`${LOG_PREFIX} 删除书签异常 | error=`, err);
    }
    fetchData();
  };

  const btnSecondary = "px-4 py-2.5 rounded-xl text-sm font-medium border border-accent/30 text-accent-light hover:bg-accent/10 transition-all";
  const btnPrimary = "px-4 py-2.5 rounded-xl text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-all shadow-lg shadow-accent/20";

  const pageContent = (!authChecked || loading) ? (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  ) : (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-app-text">后台管理</h1>
          <p className="text-app-text-secondary text-sm mt-1">
            管理分类和书签
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { if (!batchRunning) handleBatchRecognize(); }}
            disabled={batchRunning}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              batchRunning
                ? "border-app-border text-app-text-muted cursor-not-allowed"
                : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
            }`}
          >
            {batchRunning ? "识别中..." : "🔍 批量识别"}
          </button>
          <button onClick={() => setImportOpen(true)} className={btnSecondary}>
            📥 导入书签
          </button>
          <button
            onClick={() => { setEditingCat(null); setCatFormOpen(true); }}
            className={btnPrimary}
          >
            + 新建分类
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-app-border text-app-text-secondary hover:text-app-text hover:bg-app-surface-hover transition-all"
            title="站点配置"
          >
            ⚙️ 配置
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            title="退出登录"
          >
            🚪 退出
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            bookmarks={cat.bookmarks}
            showActions
            onAddBookmark={handleAddBookmark}
            onEditCategory={() => { setEditingCat(cat); setCatFormOpen(true); }}
            onDeleteCategory={() => handleDeleteCategory(cat)}
            onEditBookmark={handleEditBookmark}
            onDeleteBookmark={(bm) => handleDeleteBookmark(bm)}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-app-text-secondary mb-2">还没有数据</h2>
          <p className="text-app-text-muted text-sm mb-6">创建分类或导入书签开始使用</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setImportOpen(true)} className={btnSecondary}>
              📥 导入书签
            </button>
            <button
              onClick={() => { setEditingCat(null); setCatFormOpen(true); }}
              className={btnPrimary}
            >
              + 新建分类
            </button>
          </div>
        </div>
      )}

      {/* Batch progress overlay */}
      {batchRunning && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass rounded-2xl px-6 py-4 shadow-xl flex items-center gap-4">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-app-text">
              批量识别中 {batchProgress.current}/{batchProgress.total}
            </p>
            <p className="text-xs text-app-text-muted">
              已更新 {batchProgress.done} 个 · 跳过 {batchProgress.failed} 个
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <CategoryForm
        open={catFormOpen}
        onClose={() => { setCatFormOpen(false); setEditingCat(null); }}
        onSaved={() => { setCatFormOpen(false); setEditingCat(null); fetchData(); }}
        editing={editingCat}
      />
      <BookmarkForm
        open={bmFormOpen}
        onClose={() => { setBmFormOpen(false); setEditingBm(null); setDefaultCategoryId(undefined); }}
        onSaved={() => { setBmFormOpen(false); setEditingBm(null); setDefaultCategoryId(undefined); fetchData(); }}
        editing={editingBm}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { setImportOpen(false); fetchData(); }}
      />
      <SettingsForm
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => { setSettingsOpen(false); }}
      />
    </div>
  );

  return pageContent;
}

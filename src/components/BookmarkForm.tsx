"use client";

import { useState, useEffect } from "react";
import type { Category, Bookmark } from "@/lib/db";

const LOG_PREFIX = "[BookmarkForm]";

interface BookmarkFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: Bookmark | null;
  categories: Category[];
  defaultCategoryId?: string;
}

export function BookmarkForm({ open, onClose, onSaved, editing, categories, defaultCategoryId }: BookmarkFormProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [error, setError] = useState("");
  const [metaMsg, setMetaMsg] = useState("");

  useEffect(() => {
    if (editing) {
      console.log(`${LOG_PREFIX} 打开编辑模式 | id="${editing.id}" title="${editing.title}" url="${editing.url}" category_id="${editing.category_id}"`);
      setTitle(editing.title);
      setUrl(editing.url);
      setIcon(editing.icon || "");
      setDescription(editing.description || "");
      setCategoryId(editing.category_id);
    } else {
      const defaultCatId = defaultCategoryId || categories[0]?.id || "";
      console.log(`${LOG_PREFIX} 打开新建模式 | 可用分类数=${categories.length} | 默认分类id="${defaultCatId}"`);
      setTitle("");
      setUrl("");
      setIcon("");
      setDescription("");
      setCategoryId(defaultCatId);
    }
    setMetaMsg("");
  }, [editing, open, categories]);

  if (!open) return null;

  /** Fetch meta info from target URL */
  const handleFetchMeta = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setMetaMsg("请先输入 URL");
      return;
    }
    if (!/^https?:\/\/.+/.test(trimmedUrl)) {
      setMetaMsg("URL 必须以 http:// 或 https:// 开头");
      return;
    }

    setFetchingMeta(true);
    setMetaMsg("");

    try {
      const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(trimmedUrl)}`);
      const data = await res.json();

      if (!res.ok) {
        setMetaMsg(data.error || "抓取失败");
        return;
      }

      let filled: string[] = [];

      if (data.title && !title.trim()) {
        setTitle(data.title);
        filled.push("标题");
      }

      if (data.description && !description.trim()) {
        const desc = data.description.length > 200
          ? data.description.substring(0, 200) + "..."
          : data.description;
        setDescription(desc);
        filled.push("描述");
      }

      if (data.favicon && !icon.trim()) {
        setIcon(data.favicon);
        filled.push("图标");
      }

      if (filled.length > 0) {
        setMetaMsg(`已自动填充: ${filled.join("、")}`);
      } else {
        setMetaMsg("元数据已获取（所有字段已有值，未覆盖）");
      }
    } catch {
      setMetaMsg("抓取失败，请检查网络");
    } finally {
      setFetchingMeta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle || !trimmedUrl || !categoryId) {
      console.warn(`${LOG_PREFIX} 表单验证失败`);
      setError("请填写标题、URL和分类");
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    console.log(`${LOG_PREFIX} 开始提交 | mode=${editing ? "EDIT" : "CREATE"} | title="${trimmedTitle}" | url="${trimmedUrl}"`);
    setLoading(true);
    setError("");

    try {
      const apiUrl = editing ? `/api/bookmarks/${editing.id}` : "/api/bookmarks";
      const method = editing ? "PUT" : "POST";
      const payload = {
        title: trimmedTitle,
        url: trimmedUrl,
        icon,
        description: description.trim(),
        category_id: categoryId,
      };

      console.log(`${LOG_PREFIX} 发送请求 | method=${method} url=${apiUrl} | payload=`, payload);

      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        console.error(`${LOG_PREFIX} 请求失败 | status=${res.status}`, responseData);
        setError(responseData?.error || "保存失败");
      } else {
        console.log(`${LOG_PREFIX} 保存成功`);
        onSaved();
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} 网络异常`, err);
      setError("保存失败");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-app-surface border app-border rounded-xl px-4 py-2.5 text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative glass rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[85vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-app-text mb-4">
          {editing ? "编辑书签" : "新建书签"}
        </h3>

        <div className="space-y-3">
          {/* URL + Fetch button */}
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">链接 URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setMetaMsg(""); }}
                className={inputClass + " flex-1"}
                placeholder="https://example.com"
              />
              <button
                type="button"
                onClick={handleFetchMeta}
                disabled={fetchingMeta}
                className="px-3 py-2.5 rounded-xl text-sm font-medium border border-accent/30 text-accent-light hover:bg-accent/10 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {fetchingMeta ? "抓取中..." : "🔍 识别"}
              </button>
            </div>
            {metaMsg && (
              <p className={`mt-1.5 text-xs ${metaMsg.includes("失败") || metaMsg.includes("请先") ? "text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                {metaMsg}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="书签标题"
              autoFocus={!!editing}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass + " resize-none"}
              placeholder="链接描述（可选）"
              rows={2}
            />
          </div>

          {/* Icon + Preview */}
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">图标 URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className={inputClass + " flex-1"}
                placeholder="留空自动获取 Google Favicons"
              />
              {icon && (
                <img
                  src={icon}
                  alt=""
                  className="w-8 h-8 rounded object-contain bg-app-surface flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm border app-border text-app-text-secondary hover:text-app-text transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-all disabled:opacity-50"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}

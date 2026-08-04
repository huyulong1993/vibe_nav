"use client";

import { useState, useRef } from "react";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("请选择文件");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        setError(data.error || "导入失败");
      } else {
        setResult(
          `导入完成！新增 ${data.stats.categories} 个分类，${data.stats.bookmarks} 个书签，跳过 ${data.stats.skipped} 个重复项。`
        );
        onImported();
      }
    } catch {
      setError("导入失败，请检查文件格式");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-xl font-semibold text-app-text mb-4">导入书签</h3>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setMode("replace")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === "replace"
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : "bg-app-surface text-app-text-secondary hover:text-app-text"
            }`}
          >
            替换所有
          </button>
          <button
            onClick={() => setMode("merge")}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === "merge"
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : "bg-app-surface text-app-text-secondary hover:text-app-text"
            }`}
          >
            合并导入
          </button>
        </div>

        <p className="text-xs text-app-text-muted mb-4">
          {mode === "replace"
            ? "将清除现有数据并重新导入"
            : "保留现有数据，仅添加新书签"}
        </p>

        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed app-border rounded-xl p-6 text-center hover:border-accent/40 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
            />
            <span className="text-3xl block mb-2">📂</span>
            <p className="text-sm text-app-text-secondary">
              点击选择 HTML 书签文件
            </p>
            <p className="text-xs text-app-text-muted mt-1">
              支持浏览器导出的书签文件
            </p>
          </div>
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {result && (
          <p className="mt-3 text-sm text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
            {result}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm border app-border text-app-text-secondary hover:text-app-text transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleFileUpload}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-all disabled:opacity-50"
          >
            {loading ? "导入中..." : "开始导入"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/lib/db";

const LOG_PREFIX = "[CategoryForm]";

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: Category | null;
}

export function CategoryForm({ open, onClose, onSaved, editing }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      console.log(`${LOG_PREFIX} 打开编辑模式 | id="${editing.id}" name="${editing.name}" icon="${editing.icon}" sort_order=${editing.sort_order}`);
      setName(editing.name);
      setIcon(editing.icon);
    } else {
      console.log(`${LOG_PREFIX} 打开新建模式`);
      setName("");
      setIcon("");
    }
  }, [editing, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      console.warn(`${LOG_PREFIX} 表单验证失败: 名称为空`);
      setError("请输入分类名称");
      return;
    }

    console.log(`${LOG_PREFIX} 开始提交 | mode=${editing ? "EDIT" : "CREATE"} | name="${trimmedName}" | icon="${icon}"${editing ? ` | id="${editing.id}"` : ""}`);
    setLoading(true);
    setError("");

    try {
      const apiUrl = editing
        ? `/api/categories/${editing.id}`
        : "/api/categories";
      const method = editing ? "PUT" : "POST";
      const payload = { name: trimmedName, icon };

      console.log(`${LOG_PREFIX} 发送请求 | method=${method} url=${apiUrl} | payload=`, payload);

      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        console.error(`${LOG_PREFIX} 请求失败 | status=${res.status} statusText="${res.statusText}" | response=`, responseData);
        setError(responseData?.error || "保存失败");
      } else {
        console.log(`${LOG_PREFIX} 保存成功 | 返回数据=`, responseData);
        onSaved();
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} 网络异常 | error=`, err);
      setError("保存失败");
    } finally {
      setLoading(false);
      console.log(`${LOG_PREFIX} 提交结束 | loading=false`);
    }
  };

  const inputClass = "w-full bg-app-surface border app-border rounded-xl px-4 py-2.5 text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative glass rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-xl font-semibold text-app-text mb-4">
          {editing ? "编辑分类" : "新建分类"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="分类名称"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">图标 (Emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className={inputClass}
              placeholder="例如: 🔧"
            />
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

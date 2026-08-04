"use client";

import { useState, useEffect } from "react";
import type { SiteSettings } from "@/lib/db";

interface SettingsFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SettingsForm({ open, onClose, onSaved }: SettingsFormProps) {
  const [siteName, setSiteName] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [siteFavicon, setSiteFavicon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((d) => {
          setSiteName(d.site_name || "");
          setSiteLogo(d.site_logo || "");
          setSiteFavicon(d.site_favicon || "");
        })
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: siteName.trim(),
          site_logo: siteLogo.trim(),
          site_favicon: siteFavicon.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/admin/login"; return; }
        const d = await res.json();
        setError(d.error || "保存失败");
      } else {
        onSaved();
      }
    } catch {
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
      <form onSubmit={handleSave} className="relative glass rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-xl font-semibold text-app-text mb-4">站点配置</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">网站名称</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className={inputClass}
              placeholder="Vibe Nav"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">网站 Logo URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={siteLogo}
                onChange={(e) => setSiteLogo(e.target.value)}
                className={inputClass + " flex-1"}
                placeholder="https://..."
              />
              {siteLogo && (
                <img
                  src={siteLogo}
                  alt=""
                  className="w-8 h-8 rounded object-contain bg-app-surface flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-app-text-secondary mb-1.5">Favicon URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={siteFavicon}
                onChange={(e) => setSiteFavicon(e.target.value)}
                className={inputClass + " flex-1"}
                placeholder="https://..."
              />
              {siteFavicon && (
                <img
                  src={siteFavicon}
                  alt=""
                  className="w-5 h-5 rounded flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <p className="mt-3 text-xs text-app-text-muted">
          修改后刷新页面即可看到效果
        </p>

        <div className="flex gap-3 mt-4">
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

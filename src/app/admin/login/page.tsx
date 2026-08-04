"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace(from);
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [from, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("请输入密码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
      } else {
        // Use full page navigation to ensure cookie is processed and middleware runs
        window.location.replace(from);
      }
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-xl">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-accent/20">
            🌐
          </div>
          <h1 className="text-xl font-bold text-app-text">管理后台</h1>
          <p className="text-sm text-app-text-muted mt-1">
            请输入密码以继续
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入管理密码"
              autoFocus
              className="w-full bg-app-surface border app-border rounded-xl px-4 py-3 text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-accent/50 transition-colors text-center text-lg tracking-widest"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium bg-accent hover:bg-accent-dark text-white transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
          >
            {loading ? "验证中..." : "登 录"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-xs text-app-text-muted hover:text-accent-light transition-colors"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center min-h-[60vh] items-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

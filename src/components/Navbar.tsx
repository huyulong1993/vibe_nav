"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import type { SiteSettings } from "@/lib/db";

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin";
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  const siteName = settings?.site_name || "Vibe Nav";
  const siteLogo = settings?.site_logo;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-app-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt={siteName}
              className="w-9 h-9 rounded-xl object-contain bg-gradient-to-br from-accent to-purple-500 shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-lg shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow">
              🌐
            </div>
          )}
          <span className="text-xl font-bold gradient-text tracking-tight">
            {siteName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href={isAdmin ? "/" : "/admin"}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              border border-transparent hover:border-accent/40 hover:bg-app-surface-hover
              text-app-text-secondary hover:text-app-text"
          >
            {isAdmin ? "← 返回首页" : "⚙ 管理"}
          </Link>
        </div>
      </div>
    </nav>
  );
}

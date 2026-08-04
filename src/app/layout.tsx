import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const icons: any = {};

  if (settings.site_favicon) {
    icons.icon = settings.site_favicon;
  }

  return {
    title: settings.site_name ? `${settings.site_name} - 个人导航站` : "Vibe Nav - 个人导航站",
    description: "一个现代、高级的个人导航站",
    icons: settings.site_favicon ? { icon: settings.site_favicon } : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = getSettings();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {settings.site_favicon ? (
          <link rel="icon" href={settings.site_favicon} />
        ) : (
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>" />
        )}
      </head>
      <body className="bg-app-bg bg-grid">
        <Providers>
          <Navbar />
          <main className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

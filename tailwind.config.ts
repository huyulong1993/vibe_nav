import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "app-bg": "var(--color-bg)",
        "app-bg-secondary": "var(--color-bg-secondary)",
        "app-bg-card": "var(--color-bg-card)",
        "app-surface": "var(--color-surface)",
        "app-surface-hover": "var(--color-surface-hover)",
        "app-text": "var(--color-text)",
        "app-text-secondary": "var(--color-text-secondary)",
        "app-text-muted": "var(--color-text-muted)",
        "app-border": "var(--color-border)",
        "app-border-hover": "var(--color-border-hover)",
        accent: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;

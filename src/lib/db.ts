import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, defaultVal: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    // Corrupted file, return default
  }
  return defaultVal;
}

function writeJson(filePath: string, data: any) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  category_id: string;
  title: string;
  url: string;
  description: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

// ===== Categories =====
export function getCategories(): Category[] {
  return readJson<Category[]>(CATEGORIES_FILE, []);
}

export function saveCategories(categories: Category[]) {
  writeJson(CATEGORIES_FILE, categories);
}

export function getCategoryById(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
}

// ===== Bookmarks =====
export function getBookmarks(categoryId?: string): Bookmark[] {
  const all = readJson<Bookmark[]>(BOOKMARKS_FILE, []);
  if (categoryId) {
    return all.filter((b) => b.category_id === categoryId);
  }
  return all;
}

export function saveBookmarks(bookmarks: Bookmark[]) {
  writeJson(BOOKMARKS_FILE, bookmarks);
}

export function getBookmarkById(id: string): Bookmark | undefined {
  return getBookmarks().find((b) => b.id === id);
}

// ===== Site Settings =====
export interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_favicon: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "Vibe Nav",
  site_logo: "",
  site_favicon: "",
};

export function getSettings(): SiteSettings {
  return readJson<SiteSettings>(SETTINGS_FILE, { ...DEFAULT_SETTINGS });
}

export function saveSettings(settings: SiteSettings) {
  writeJson(SETTINGS_FILE, settings);
}

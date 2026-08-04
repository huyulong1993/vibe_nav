"use client";

import { BookmarkItem } from "./BookmarkItem";
import type { Category, Bookmark } from "@/lib/db";

interface CategoryCardProps {
  category: Category;
  bookmarks: Bookmark[];
  showActions?: boolean;
  onEditBookmark?: (bm: Bookmark) => void;
  onDeleteBookmark?: (bm: Bookmark) => void;
  onEditCategory?: () => void;
  onDeleteCategory?: () => void;
}

export function CategoryCard({
  category,
  bookmarks,
  showActions,
  onEditBookmark,
  onDeleteBookmark,
  onEditCategory,
  onDeleteCategory,
}: CategoryCardProps) {
  return (
    <div className="glass rounded-2xl p-5 card-transition pulse-glow group/cat shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{category.icon || '📁'}</span>
          <h2 className="text-lg font-semibold text-app-text tracking-tight">
            {category.name}
          </h2>
          <span className="text-xs text-app-text-muted bg-app-surface px-2 py-0.5 rounded-full">
            {bookmarks.length}
          </span>
        </div>

        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
            {onEditCategory && (
              <button
                onClick={onEditCategory}
                className="p-1.5 rounded-lg hover:bg-accent/20 text-app-text-muted hover:text-accent-light transition-colors text-xs"
                title="编辑分类"
              >
                ✏️
              </button>
            )}
            {onDeleteCategory && (
              <button
                onClick={onDeleteCategory}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-app-text-muted hover:text-red-400 transition-colors text-xs"
                title="删除分类"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bookmarks Grid */}
      {bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {bookmarks.map((bm) => (
            <BookmarkItem
              key={bm.id}
              title={bm.title}
              url={bm.url}
              icon={bm.icon}
              description={bm.description}
              showActions={showActions}
              onEdit={() => onEditBookmark?.(bm)}
              onDelete={() => onDeleteBookmark?.(bm)}
            />
          ))}
        </div>
      ) : (
        <p className="text-app-text-muted text-sm py-4 text-center">暂无书签</p>
      )}
    </div>
  );
}

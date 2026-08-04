"use client";

import { useState } from "react";

interface BookmarkItemProps {
  title: string;
  url: string;
  icon: string;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function BookmarkItem({
  title,
  url,
  icon,
  description,
  onEdit,
  onDelete,
  showActions,
}: BookmarkItemProps) {
  const [imgError, setImgError] = useState(false);
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  return (
    <div className="group relative">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 px-3 py-3 rounded-xl card-transition
          hover:bg-app-surface-hover
          border border-transparent hover:border-app-border-hover"
        title={description || title}
      >
        {/* Icon / Favicon */}
        <div className="w-8 h-8 rounded-lg bg-app-surface flex-shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
          {!imgError && icon ? (
            <img
              src={icon}
              alt=""
              className="w-5 h-5 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-xs text-app-text-muted font-bold">
              {title.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-app-text truncate group-hover:text-accent-light transition-colors">
            {title}
          </div>
          {description ? (
            <p className="text-xs text-app-text-muted mt-0.5 line-clamp-2 leading-snug">
              {description}
            </p>
          ) : (
            <p className="text-xs text-app-text-muted mt-0.5 truncate">
              {hostname}
            </p>
          )}
        </div>
      </a>

      {showActions && (
        <div className="absolute right-0 top-1 hidden group-hover:flex items-center gap-1 pr-2 z-10">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit();
              }}
              className="p-1 rounded-lg hover:bg-accent/20 text-app-text-muted hover:text-accent-light transition-colors text-xs"
              title="编辑"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete();
              }}
              className="p-1 rounded-lg hover:bg-red-500/20 text-app-text-muted hover:text-red-400 transition-colors text-xs"
              title="删除"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}

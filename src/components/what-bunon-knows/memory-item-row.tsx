/**
 * 1. Purpose: Renders a single editable and pinnable memory fact row on Page 50a.
 * 2. Spec Ref: Stitch what_bunon_knows Rows & Page 50a.
 * 3. Called By: WhatBunonKnowsView.
 * 4. Calls: Lucide icons and native input elements.
 */

'use client';

import { useState } from 'react';
import { Bookmark, Edit2, X, Check } from 'lucide-react';
import type { MemoryItem } from '@/types/domain';

export function MemoryItemRow({
  item,
  onUpdate,
  onDelete,
}: Readonly<{
  item: MemoryItem;
  onUpdate: (id: string, updates: Partial<MemoryItem>) => void;
  onDelete: (id: string) => void;
}>) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(item.fact);

  const handleSaveEdit = () => {
    if (text.trim() && text !== item.fact) {
      onUpdate(item.id, { fact: text.trim() });
    }
    setIsEditing(false);
  };

  const togglePin = () => {
    onUpdate(item.id, { pinned: !item.pinned });
  };

  return (
    <article className="py-3 flex justify-between items-start gap-3 border-b border-hairline last:border-b-0">
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-[14px] bg-secondary-surface px-3 py-1.5 rounded-lg border border-hairline text-ink outline-none"
            autoFocus
          />
          <button
            type="button"
            aria-label="Save"
            onClick={handleSaveEdit}
            className="p-1.5 rounded-full hover:bg-secondary-surface text-ink cursor-pointer"
          >
            <Check size={16} />
          </button>
        </div>
      ) : (
        <p className="text-ink text-[14px] font-normal leading-snug flex-1">
          {item.fact}
        </p>
      )}

      {!isEditing && (
        <div className="flex items-center gap-1.5 shrink-0 text-muted pt-0.5">
          <button
            type="button"
            aria-label={item.pinned ? 'Unpin rule' : 'Pin rule'}
            onClick={togglePin}
            className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer ${
              item.pinned
                ? 'text-[#FFB020]'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Bookmark size={16} className={item.pinned ? 'fill-current' : ''} />
          </button>

          <button
            type="button"
            aria-label="Edit rule"
            onClick={() => setIsEditing(true)}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
          >
            <Edit2 size={15} />
          </button>

          <button
            type="button"
            aria-label="Delete rule"
            onClick={() => onDelete(item.id)}
            className="w-7 h-7 flex items-center justify-center text-inactive hover:text-ink transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </article>
  );
}

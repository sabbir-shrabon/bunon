/**
 * 1. Purpose: Inline editable card displaying 3-6 memory facts understood by Bunon on Screen 17.
 * 2. Spec Ref: Stitch UI Design Guide Category B Screen 17 & What Bunon Knows contract.
 * 3. Called By: Screen17RoadmapPreview.
 * 4. Calls: Lucide icons (Sparkles, Plus, X, Check), next/link.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Plus, X, Check } from 'lucide-react';

export interface EditableMemoryFact {
  scope: 'PERSON' | 'GOAL';
  bucket: string;
  fact: string;
}

interface UnderstoodFactsCardProps {
  facts: EditableMemoryFact[];
  onChangeFacts: (updated: EditableMemoryFact[]) => void;
}

export function UnderstoodFactsCard({ facts, onChangeFacts }: Readonly<UnderstoodFactsCardProps>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newFactText, setNewFactText] = useState('');

  const handleStartEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditText(currentText);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editText.trim();
    if (!trimmed) {
      handleRemove(index);
    } else {
      const updated = facts.map((item, idx) =>
        idx === index ? { ...item, fact: trimmed.slice(0, 250) } : item
      );
      onChangeFacts(updated);
    }
    setEditingIndex(null);
    setEditText('');
  };

  const handleRemove = (index: number) => {
    const updated = facts.filter((_, idx) => idx !== index);
    onChangeFacts(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditText('');
    }
  };

  const handleAddCustomFact = () => {
    const trimmed = newFactText.trim();
    if (trimmed) {
      const newFact: EditableMemoryFact = {
        scope: 'GOAL',
        bucket: 'what_works_for_this_user',
        fact: trimmed.slice(0, 250),
      };
      onChangeFacts([...facts, newFact]);
    }
    setNewFactText('');
    setIsAdding(false);
  };

  return (
    <div className="rounded-[20px] border border-hairline bg-card p-4 md:p-5 shadow-none flex flex-col gap-3.5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-secondary-surface flex items-center justify-center text-ink shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-[14px] font-semibold text-ink">
            What Bunon understood about you
          </h2>
        </div>
        <Link
          href="/what-bunon-knows"
          className="text-[12px] font-medium text-muted hover:text-ink transition-colors"
        >
          Open full view ›
        </Link>
      </div>

      {/* Facts Chips Grid / Flex */}
      <div className="flex flex-wrap items-center gap-2">
        {facts.map((item, idx) => {
          const isCurrentlyEditing = editingIndex === idx;

          if (isCurrentlyEditing) {
            return (
              <div
                key={`editing-${idx}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink bg-card text-xs"
              >
                <input
                  type="text"
                  autoFocus
                  value={editText}
                  maxLength={250}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEdit(idx);
                    } else if (e.key === 'Escape') {
                      setEditingIndex(null);
                    }
                  }}
                  className="bg-transparent text-ink text-xs focus:outline-none min-w-[140px] max-w-[260px]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit(idx)}
                  className="text-ink hover:text-muted cursor-pointer"
                  aria-label="Save chip edit"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={`fact-${idx}`}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-secondary-surface/50 text-[12px] text-ink hover:border-ink/40 transition-colors"
            >
              <button
                type="button"
                onClick={() => handleStartEdit(idx, item.fact)}
                className="text-left truncate max-w-[240px] sm:max-w-[340px] cursor-pointer hover:underline"
                title="Tap to edit"
              >
                {item.fact}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-0.5 rounded-full text-muted hover:text-ink transition-colors cursor-pointer"
                aria-label="Remove fact"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Inline Add Note Input */}
        {isAdding ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink bg-card text-xs">
            <input
              type="text"
              autoFocus
              value={newFactText}
              maxLength={250}
              placeholder="e.g. Free only on evenings"
              onChange={(e) => setNewFactText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomFact();
                } else if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewFactText('');
                }
              }}
              className="bg-transparent text-ink text-xs focus:outline-none min-w-[140px] max-w-[240px]"
            />
            <button
              type="button"
              onClick={handleAddCustomFact}
              className="text-ink hover:text-muted cursor-pointer"
              aria-label="Confirm new fact"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewFactText('');
              }}
              className="text-muted hover:text-ink cursor-pointer"
              aria-label="Cancel new fact"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-hairline text-[12px] text-muted hover:text-ink hover:border-ink/50 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add a note</span>
          </button>
        )}
      </div>

      {/* Underneath Calm Note */}
      <p className="text-[11px] text-muted leading-relaxed">
        Saved to What Bunon knows — edit or remove anything anytime.
      </p>
    </div>
  );
}

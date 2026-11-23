/**
 * 1. Purpose: Bottom sheet for roadmap adjustments/regeneration reasons.
 * 2. Spec Ref: Screen 17 in Category B, Section 3 UI Design Guide.
 * 3. Called By: Screen17RoadmapPreview.
 * 4. Calls: BottomSheet, PrimaryButton.
 */

'use client';

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

interface SheetAdjustRoadmapProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (reason: string, notes?: string) => Promise<void>;
}

const REASONS = ['Too ambitious', 'Wrong approach', 'Missing a step'];

export function SheetAdjustRoadmap({
  isOpen,
  onClose,
  onRegenerate,
}: SheetAdjustRoadmapProps) {
  const [reason, setReason] = useState('Too ambitious');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onRegenerate(reason, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Adjust my roadmap">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted">
          Tell Bunon how to adjust your roadmap. Your previous plan will be saved as Plan A.
        </p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                reason === r
                  ? 'bg-ink text-page border-ink'
                  : 'bg-card text-ink border-hairline hover:border-ink'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 150))}
          placeholder="Optional 1-line note..."
          className="w-full p-3 rounded-xl bg-card border border-hairline text-xs text-ink placeholder:text-inactive focus:outline-none focus:border-ink transition-colors"
        />

        <PrimaryButton
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-2"
        >
          {isSubmitting ? 'Regenerating roadmap...' : 'Build adjusted roadmap'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}

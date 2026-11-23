/**
 * 1. Purpose: Optional effort check-in card (Too easy / Just right / Too hard) with nothing pre-selected.
 * 2. Spec Ref: Stitch create_proof Screen 40 Effort check-in.
 * 3. Called By: CreateProofView.
 * 4. Calls: Pure UI markup and state toggles.
 */

'use client';

interface EffortCheckinCardProps {
  effortRating: 'easy' | 'balanced' | 'hard' | null;
  onSelectRating: (rating: 'easy' | 'balanced' | 'hard' | null) => void;
  onDismiss: () => void;
}

export function EffortCheckinCard({
  effortRating,
  onSelectRating,
  onDismiss,
}: Readonly<EffortCheckinCardProps>) {
  return (
    <div className="w-full bg-card rounded-[20px] border border-hairline/60 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-ink">How did it feel?</span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-[12px] text-muted hover:text-ink transition-colors cursor-pointer"
        >
          Not useful
        </button>
      </div>
      <div className="flex items-center gap-2 pt-1">
        {(['easy', 'balanced', 'hard'] as const).map((lvl) => {
          const label = lvl === 'easy' ? 'Too easy' : lvl === 'balanced' ? 'Just right' : 'Too hard';
          const isSelected = effortRating === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onSelectRating(isSelected ? null : lvl)}
              className={`flex-1 py-2 px-3 rounded-full text-[12px] font-medium text-center transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-ink text-[var(--card)]'
                  : 'bg-[var(--page)] text-ink border border-hairline/60 hover:bg-[var(--secondary-surface)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

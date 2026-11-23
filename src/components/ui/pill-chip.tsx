/**
 * 1. Purpose: Displays a compact, neutral pill for a selected state or quiet metadata.
 * 2. Spec Ref: Stitch DESIGN.md Chips and UI Design Guide Section 1.
 * 3. Called By: Shell and future category selection controls.
 * 4. Calls: Native span element.
 */

import type { ReactNode } from 'react';

export function PillChip({
  children,
  active = false,
}: Readonly<{
  children: ReactNode;
  active?: boolean;
}>) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-[#1A1A1B] text-[#FFFFFF] dark:bg-[#EDEEEF] dark:text-[#0E0F11]'
          : 'border border-hairline bg-card text-muted hover:border-ink hover:text-ink'
      }`}
    >
      {children}
    </span>
  );
}

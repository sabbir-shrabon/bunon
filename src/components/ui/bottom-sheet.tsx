/**
 * 1. Purpose: Positions transient content as a mobile bottom sheet or desktop centered modal.
 * 2. Spec Ref: Stitch DESIGN.md Elevation and Bottom Sheet geometry.
 * 3. Called By: Future lightweight dialogs and auxiliary actions.
 * 4. Calls: React portal-free overlay markup.
 */

import type { ReactNode } from 'react';

export function BottomSheet({
  children,
  onDismiss,
  isOpen = true,
  onClose,
  title,
}: Readonly<{
  children: ReactNode;
  onDismiss?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
}>) {
  if (!isOpen) return null;

  const handleClose = onClose || onDismiss || (() => {});

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-black/20 p-0 md:items-center md:justify-center md:p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <section
        className="relative w-full rounded-t-[28px] bg-card p-6 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] md:max-w-[480px] md:rounded-[24px]"
        onClick={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-muted hover:text-ink transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
        {children}
      </section>
    </div>
  );
}

/**
 * 1. Purpose: Renders a quiet outlined or neutral-filled secondary pill action.
 * 2. Spec Ref: Stitch DESIGN.md Buttons and UI Design Guide Section 1.
 * 3. Called By: Authentication and shell controls.
 * 4. Calls: Native button element.
 */

import type { ButtonHTMLAttributes } from 'react';

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  filled?: boolean;
};

export function SecondaryButton({
  className = '',
  filled = false,
  children,
  ...props
}: Readonly<SecondaryButtonProps>) {
  const surface = filled
    ? 'bg-secondary-surface border-transparent'
    : 'border border-hairline bg-transparent';

  return (
    <button
      className={`h-[52px] rounded-full px-5 text-[15px] font-medium text-ink transition-colors hover:bg-secondary-surface disabled:opacity-50 select-none shadow-none cursor-pointer ${surface} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

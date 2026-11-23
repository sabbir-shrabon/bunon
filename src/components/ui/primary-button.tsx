/**
 * 1. Purpose: Renders Bunon's single high-emphasis pill-shaped action per screen.
 * 2. Spec Ref: Stitch DESIGN.md Buttons and UI Design Guide Section 1.
 * 3. Called By: Guest entry and authentication forms.
 * 4. Calls: Native button element.
 */

import type { ButtonHTMLAttributes } from 'react';

export function PrimaryButton({
  className = '',
  children,
  ...props
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={`h-[52px] w-full rounded-full bg-[#1A1A1B] !text-[#FFFFFF] text-[#FFFFFF] dark:bg-[#EDEEEF] dark:!text-[#0E0F11] dark:text-[#0E0F11] px-5 text-[15px] font-medium transition-all duration-150 hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 select-none shadow-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

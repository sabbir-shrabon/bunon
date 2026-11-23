/**
 * 1. Purpose: Renders the Thread B logo, status knots, and thread illustrations.
 * 2. Spec Ref: Stitch DESIGN.md The Thread and Milestone Knots.
 * 3. Called By: App shell, guest entry screen, and progress indicators.
 * 4. Calls: Inline SVG elements.
 */

type NodeState = 'done' | 'current' | 'upcoming';

export function ThreadLogo({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <span
      className={`relative inline-flex h-6 w-6 items-center justify-center shrink-0 ${className}`}
      aria-label="Bunon"
    >
      <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-hairline" />
      <svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5 fill-current text-ink"
        aria-hidden="true"
      >
        <path d="M6 3h7a5 5 0 0 1 3.5 8.5A5.5 5.5 0 0 1 12.5 21H6V3Zm3 3v5h4a2.5 2.5 0 0 0 0-5H9Zm0 8v4h3.5a2.5 2.5 0 0 0 0-5H9Z" />
      </svg>
    </span>
  );
}

export function ThreadNode({ state = 'current' }: Readonly<{ state?: NodeState }>) {
  if (state === 'done') {
    return (
      <span
        aria-label="Completed knot"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-marigold text-[10px] text-white"
      >
        ✓
      </span>
    );
  }
  if (state === 'upcoming') {
    return (
      <span
        aria-label="Upcoming knot"
        className="h-2.5 w-2.5 shrink-0 rounded-full bg-hairline"
      />
    );
  }
  return (
    <span
      aria-label="Current knot"
      className="h-4 w-4 shrink-0 rounded-full border-2 border-ink bg-card"
    />
  );
}

export function ThreadKnotIllustration({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      fill="none"
      height="68"
      viewBox="0 0 24 68"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line
        stroke="var(--hairline, #E3E5E8)"
        strokeLinecap="round"
        strokeWidth="1.5"
        x1="12"
        x2="12"
        y1="0"
        y2="28"
      />
      <circle
        cx="12"
        cy="34"
        fill="var(--card, #FFFFFF)"
        r="5.25"
        stroke="var(--ink, #191C1D)"
        strokeWidth="1.5"
      />
      <line
        stroke="var(--hairline, #E3E5E8)"
        strokeLinecap="round"
        strokeWidth="1.5"
        x1="12"
        x2="12"
        y1="40"
        y2="68"
      />
    </svg>
  );
}

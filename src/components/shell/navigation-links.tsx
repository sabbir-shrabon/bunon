/**
 * 1. Purpose: Shares the three primary Bunon navigation destinations across responsive shells.
 * 2. Spec Ref: UI Design Guide Section 1 and Desktop Shell 22D.
 * 3. Called By: BottomNav, DesktopSidebar, and mobile shell.
 * 4. Calls: next/link, next/navigation, and Lucide icons.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, GitBranch, LineChart } from 'lucide-react';

const links = [
  { href: '/today', label: 'Today', icon: CalendarDays },
  { href: '/roadmap', label: 'Roadmap', icon: GitBranch },
  { href: '/timeline', label: 'Timeline', icon: LineChart },
];

export function PrimaryNavigation({
  desktop = false,
}: Readonly<{
  desktop?: boolean;
}>) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className={
        desktop
          ? 'flex flex-col gap-0.5'
          : 'flex h-16 items-center justify-around'
      }
    >
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || (href === '/today' && pathname === '/');

        if (desktop) {
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center px-3 py-1.5 rounded-full transition-colors text-[13.5px] font-medium ${
                isActive
                  ? 'bg-[#1A1A1B] !text-white text-white dark:bg-[#EDEEEF] dark:!text-[#0E0F11] dark:text-[#0E0F11]'
                  : 'text-muted hover:bg-secondary-surface hover:text-ink'
              }`}
            >
              <Icon size={16} className="mr-2.5 shrink-0" strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-0.5 text-[12px] transition-colors ${
              isActive
                ? 'font-semibold text-ink'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

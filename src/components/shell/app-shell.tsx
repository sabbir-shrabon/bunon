/**
 * 1. Purpose: Composes Bunon's responsive mobile and desktop application shell with live status guards.
 * 2. Spec Ref: UI Design Guide Section 1, Drawer 69, Desktop Shell 22D, Screen 118, Screen 122.
 * 3. Called By: Direct guest entry and user-facing workspace pages.
 * 4. Calls: Session hook, TopBar, LeftDrawer, DesktopSidebar, DesktopTopActions, BottomNav.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';
import { DesktopSidebar } from './desktop-sidebar';
import { DesktopTopActions } from './desktop-top-actions';
import { LeftDrawer } from './left-drawer';
import { TopBar } from './top-bar';
import { AccountSuspendedScreen } from './account-suspended-screen';
import { MaintenanceScreen } from './maintenance-screen';
import { useAuthSession } from './auth-session';

const MAINTENANCE_EXEMPT_PATHS = ['/legal', '/privacy', '/terms', '/refund'];
const SUSPENDED_EXEMPT_PATHS = ['/support', '/legal', '/privacy', '/terms', '/refund', '/login'];

function matchesAnyPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname() || '';
  const { user, proUntil, isPro, accountStatus, maintenanceMode } = useAuthSession();

  if (maintenanceMode && !matchesAnyPrefix(pathname, MAINTENANCE_EXEMPT_PATHS)) {
    return <MaintenanceScreen />;
  }

  if (user && accountStatus === 'SUSPENDED' && !matchesAnyPrefix(pathname, SUSPENDED_EXEMPT_PATHS)) {
    return <AccountSuspendedScreen />;
  }

  return (
    <div className="min-h-screen bg-page text-ink selection:bg-secondary-surface">
      <TopBar user={user} onOpenDrawer={() => setDrawerOpen(true)} />
      <LeftDrawer
        open={drawerOpen}
        user={user}
        isPro={isPro}
        proUntil={proUntil}
        onClose={() => setDrawerOpen(false)}
      />
      <DesktopSidebar user={user} isPro={isPro} proUntil={proUntil} />
      <DesktopTopActions user={user} />
      <main className="min-h-screen pb-20 pt-14 md:ml-[250px] md:pb-0 md:pt-14">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

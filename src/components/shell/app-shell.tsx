/**
 * 1. Purpose: Composes Bunon's responsive mobile and desktop application shell.
 * 2. Spec Ref: UI Design Guide Section 1, Drawer 69, and Desktop Shell 22D.
 * 3. Called By: Direct guest entry and later user-facing workspace pages.
 * 4. Calls: Session hook, TopBar, LeftDrawer, DesktopSidebar, DesktopTopActions, and BottomNav.
 */

'use client';

import { useState, type ReactNode } from 'react';
import { BottomNav } from './bottom-nav';
import { DesktopSidebar } from './desktop-sidebar';
import { DesktopTopActions } from './desktop-top-actions';
import { LeftDrawer } from './left-drawer';
import { TopBar } from './top-bar';
import { useAuthSession } from './auth-session';

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuthSession();

  return (
    <div className="min-h-screen bg-page text-ink selection:bg-secondary-surface">
      <TopBar user={user} onOpenDrawer={() => setDrawerOpen(true)} />
      <LeftDrawer open={drawerOpen} user={user} onClose={() => setDrawerOpen(false)} />
      <DesktopSidebar user={user} />
      <DesktopTopActions user={user} />
      <main className="min-h-screen pb-20 pt-14 md:ml-[250px] md:pb-0 md:pt-14">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

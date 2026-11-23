/**
 * 1. Purpose: Renders the persistent three-tab navigation at mobile viewport widths.
 * 2. Spec Ref: Stitch guest entry screen and Mobile Shell requirements.
 * 3. Called By: AppShell.
 * 4. Calls: PrimaryNavigation.
 */

import { PrimaryNavigation } from './navigation-links';

export function BottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-card/80 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl shadow-[0_-1px_8px_rgba(0,0,0,0.04)] md:hidden"
    >
      <div className="mx-auto max-w-[390px]">
        <PrimaryNavigation />
      </div>
    </nav>
  );
}

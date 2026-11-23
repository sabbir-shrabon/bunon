/**
 * 1. Purpose: Renders Drawer 69 settings links, controls, and signed-in session actions.
 * 2. Spec Ref: UI Design Guide Left Drawer 69 and Stitch navigation_drawer.
 * 3. Called By: LeftDrawer and DesktopSidebar.
 * 4. Calls: AppPreferences, next/link, and browser auth API.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain,
  ChevronRight,
  CircleHelp,
  FileText,
  Gift,
  Globe,
  LogOut,
  MessageSquare,
  Moon,
  Settings2,
  Sparkles,
  Target,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useAppPreferences } from '@/lib/i18n/app-preferences';

type DrawerLinksProps = {
  user: User | null;
  onNavigate?: () => void;
  onOpenInvite?: () => void;
};

const topLinks = [
  { href: '/goals', label: 'Goals & Journey Cards', icon: Target },
  { href: '/what-bunon-knows', label: 'What Bunon knows', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

const bottomStaticLinks = [
  { href: '/legal', label: 'Terms and policy', icon: FileText },
  { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/support', label: 'Help & support', icon: CircleHelp },
];

export function DrawerLinks({
  user,
  onNavigate,
  onOpenInvite,
}: Readonly<DrawerLinksProps>) {
  const router = useRouter();
  const { theme, language, setTheme, setLanguage } = useAppPreferences();

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    onNavigate?.();
    router.replace('/today');
    router.refresh();
  };

  const handleInviteClick = () => {
    onNavigate?.();
    if (onOpenInvite) {
      onOpenInvite();
    } else {
      router.push('/invite');
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Group 1: Knowledge & Settings */}
      <nav aria-label="Settings navigation" className="flex flex-col w-full">
        {topLinks.map(({ href, label, icon: Icon }) => (
          <div key={href} className="w-full">
            <Link
              href={href}
              onClick={onNavigate}
              className="flex items-center justify-between py-1.5 text-ink hover:text-muted transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className="text-muted group-hover:text-ink transition-colors" />
                <span className="text-[13.5px] font-normal leading-[19px]">{label}</span>
              </div>
              <ChevronRight size={14} className="text-muted" />
            </Link>
            <div className="h-[1px] w-full bg-hairline" />
          </div>
        ))}

        {/* 3. Dark mode */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Moon size={16} className="text-muted" />
            <span className="text-[13.5px] font-normal leading-[19px] text-ink">Dark mode</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'DARK'}
            aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === 'DARK' ? 'LIGHT' : 'DARK')}
            className={`relative h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer ${
              theme === 'DARK' ? 'bg-[#1A1A1B]' : 'bg-secondary-surface'
            }`}
          >
            <span
              className={`block h-4 w-4 rounded-full bg-card transition-transform duration-200 ${
                theme === 'DARK' ? 'translate-x-4' : ''
              }`}
            />
          </button>
        </div>
        <div className="h-[1px] w-full bg-hairline" />

        {/* 4. Language */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Globe size={16} className="text-muted" />
            <span className="text-[13.5px] font-normal leading-[19px] text-ink">Language</span>
          </div>
          <select
            aria-label="Application language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'EN' | 'BN')}
            className="flex items-center rounded-full bg-secondary-surface px-2 py-0.5 text-[11px] font-medium text-ink outline-none cursor-pointer"
          >
            <option value="EN">English</option>
            <option value="BN">বাংলা</option>
          </select>
        </div>
        <div className="h-[1px] w-full bg-hairline" />

        {/* 5. Invite friends (Screen 110 Sheet) */}
        <div className="w-full">
          <button
            type="button"
            onClick={handleInviteClick}
            className="flex w-full items-center justify-between py-1.5 text-ink hover:text-muted transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <Gift size={16} className="text-muted group-hover:text-ink transition-colors" />
              <span className="text-[13.5px] font-normal leading-[19px]">Invite friends</span>
            </div>
            <ChevronRight size={14} className="text-muted" />
          </button>
          <div className="h-[1px] w-full bg-hairline" />
        </div>

        {/* Group 2: Terms, Feedback, Support */}
        {bottomStaticLinks.map(({ href, label, icon: Icon }) => (
          <div key={href} className="w-full">
            <Link
              href={href}
              onClick={onNavigate}
              className="flex items-center justify-between py-1.5 text-ink hover:text-muted transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} className="text-muted group-hover:text-ink transition-colors" />
                <span className="text-[13.5px] font-normal leading-[19px]">{label}</span>
              </div>
              <ChevronRight size={14} className="text-muted" />
            </Link>
            <div className="h-[1px] w-full bg-hairline" />
          </div>
        ))}

        {/* 9. Pro */}
        <div className="w-full">
          <Link
            href="/pro"
            onClick={onNavigate}
            className="flex items-center justify-between py-1.5 text-ink hover:text-muted transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-muted group-hover:text-ink transition-colors" />
              <span className="text-[13.5px] font-normal leading-[19px]">Pro</span>
            </div>
            <span className="rounded-full bg-secondary-surface px-2 py-0.5 text-[10.5px] font-medium text-muted">
              Free plan
            </span>
          </Link>
        </div>
      </nav>

      {/* Drawer Footer */}
      <div className="pt-2.5 pb-1 flex flex-col gap-1.5">
        <div className="h-[1px] w-full bg-hairline mb-1" />
        {user && (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors w-fit text-[11.5px] font-medium py-0.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        )}
        <p className="text-[10.5px] text-muted tracking-normal pt-0.5">
          Bunon v1.0.4 · Quiet productivity
        </p>
      </div>
    </div>
  );
}

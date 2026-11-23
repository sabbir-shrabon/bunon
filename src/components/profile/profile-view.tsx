/**
 * 1. Purpose: Renders the owner-only profile screen with thread statistics and details.
 * 2. Spec Ref: Screen 79 Profile in Stitch UI Design Guide Category G.
 * 3. Called By: /profile Page.
 * 4. Calls: AppShell, next/link, next/navigation, and Lucide icons.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Flame,
  MapPin,
  Pencil,
  Target,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { AppShell } from '@/components/shell/app-shell';
import type { UserRow } from '@/types/database';

type ProfileViewProps = {
  user: User;
  profile: Partial<UserRow> | null;
  completedChapters: number;
};

export function ProfileView({
  user,
  profile,
  completedChapters,
}: Readonly<ProfileViewProps>) {
  const router = useRouter();

  const name =
    profile?.name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Bunon user';
  const initial = name.slice(0, 1).toUpperCase();
  const avatarUrl = profile?.avatar_url;
  const streakCount = profile?.streak_count ?? 0;
  const showStreak = streakCount >= 3;
  const streakLabel =
    streakCount >= 14
      ? `Streak: ${Math.floor(streakCount / 7)} weeks`
      : `Streak: ${streakCount} days`;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:py-8 space-y-6">
        {/* Header with Back Arrow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Profile
            </h1>
          </div>
          <Link
            href="/profile/edit"
            className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-4 py-1.5 text-xs font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer"
          >
            <Pencil size={13} />
            <span>Edit profile</span>
          </Link>
        </div>

        {/* Identity & Details Card */}
        <div className="rounded-[24px] border border-hairline bg-card p-6 md:p-8 space-y-5 shadow-none">
          {/* Avatar + Main Info */}
          <div className="flex items-start gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="h-18 w-18 rounded-full border border-hairline object-cover"
              />
            ) : (
              <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-[#1A1A1B] text-2xl font-semibold text-white">
                {initial}
              </div>
            )}

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink truncate leading-tight">
                  {name}
                </h2>
                {showStreak && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary-surface px-2.5 py-0.5 text-xs font-medium text-ink">
                    <Flame size={13} className="text-[#FFB020]" />
                    <span>{streakLabel}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">{user.email}</p>

              {/* Continuous Thread Chapters Count */}
              <p className="text-xs text-muted mt-2">
                Your thread:{' '}
                <strong className="text-ink font-medium">
                  {completedChapters}{' '}
                  {completedChapters === 1 ? 'chapter' : 'chapters'} completed
                </strong>
              </p>
            </div>
          </div>

          {/* Optional Bio */}
          {profile?.bio && (
            <p className="text-sm text-ink leading-relaxed border-t border-hairline pt-4">
              &ldquo;{profile.bio}&rdquo;
            </p>
          )}

          {/* Location & Role Chips */}
          {(profile?.city_country || profile?.work_study_role) && (
            <div className="flex flex-wrap gap-3 border-t border-hairline pt-4 text-xs text-muted">
              {profile.city_country && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="shrink-0 text-muted" />
                  <span>{profile.city_country}</span>
                </div>
              )}
              {profile.work_study_role && (
                <div className="flex items-center gap-1.5">
                  <Briefcase size={14} className="shrink-0 text-muted" />
                  <span>{profile.work_study_role}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Link to Goals & Journey Cards */}
        <Link
          href="/goals"
          className="group flex items-center justify-between rounded-[20px] border border-hairline bg-card p-5 transition-colors hover:bg-secondary-surface/40 shadow-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-surface text-ink group-hover:bg-card">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink group-hover:text-muted transition-colors">
                Goals &amp; Journey Cards
              </h3>
              <p className="text-xs text-muted mt-0.5">
                Inspect your milestones, past chapters, and public Journey Cards
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-muted group-hover:text-ink transition-colors shrink-0 ml-2"
          />
        </Link>
      </div>
    </AppShell>
  );
}

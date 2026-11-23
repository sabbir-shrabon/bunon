/**
 * 1. Purpose: Form view to edit personal profile details and trigger the avatar sheet.
 * 2. Spec Ref: Screen 80 Edit profile in Stitch UI Design Guide Category G.
 * 3. Called By: /profile/edit Page.
 * 4. Calls: AppShell, AvatarPickerSheet, PrimaryButton, next/navigation, and Lucide icons.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { AppShell } from '@/components/shell/app-shell';
import { PrimaryButton } from '@/components/ui/primary-button';
import { AvatarPickerSheet } from './avatar-picker-sheet';
import type { UserRow } from '@/types/database';

type EditProfileViewProps = {
  user: User;
  profile: Partial<UserRow> | null;
};

export function EditProfileView({
  user,
  profile,
}: Readonly<EditProfileViewProps>) {
  const router = useRouter();

  const [name, setName] = useState(
    profile?.name || user.user_metadata?.name || ''
  );
  const [bio, setBio] = useState(profile?.bio || '');
  const [cityCountry, setCityCountry] = useState(profile?.city_country || '');
  const [workStudyRole, setWorkStudyRole] = useState(
    profile?.work_study_role || ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url || null
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initial = (name || user.email || 'B').slice(0, 1).toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || null,
          city_country: cityCountry.trim() || null,
          work_study_role: workStudyRole.trim() || null,
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Could not update profile');
      }

      router.push('/profile');
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong saving profile'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-4 py-6 md:py-8 space-y-6">
        {/* Header with Back Arrow */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-secondary-surface hover:text-ink transition-colors cursor-pointer"
            aria-label="Go back to profile"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Edit profile
            </h1>
            <p className="text-xs text-muted">Screen 80 · Updates your Journey Card name too</p>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSave}
          className="rounded-[24px] border border-hairline bg-card p-6 md:p-8 space-y-5 shadow-none"
        >
          {/* Avatar Clicker */}
          <div className="flex flex-col items-center justify-center pb-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-hairline overflow-hidden cursor-pointer"
              aria-label="Change profile photo"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1A1A1B] text-2xl font-semibold text-white">
                  {initial}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <Camera size={20} />
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="mt-2 text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer"
            >
              Change photo
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5"
            >
              Name (Required)
            </label>
            <input
              id="profile-name"
              type="text"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="h-12 w-full rounded-xl border border-hairline bg-page px-3.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
            />
          </div>

          {/* Bio Field (Max 80 chars) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="profile-bio"
                className="block text-xs font-medium text-muted uppercase tracking-wider"
              >
                Short bio
              </label>
              <span className="text-[11px] text-muted">{bio.length} / 80</span>
            </div>
            <textarea
              id="profile-bio"
              rows={2}
              maxLength={80}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Student at DU, preparing for IELTS..."
              className="w-full rounded-xl border border-hairline bg-page px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* City / Country */}
          <div>
            <label
              htmlFor="profile-city"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5"
            >
              City / Country
            </label>
            <input
              id="profile-city"
              type="text"
              maxLength={80}
              value={cityCountry}
              onChange={(e) => setCityCountry(e.target.value)}
              placeholder="e.g. Dhaka, Bangladesh"
              className="h-12 w-full rounded-xl border border-hairline bg-page px-3.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
            />
          </div>

          {/* Work / Study Role */}
          <div>
            <label
              htmlFor="profile-role"
              className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5"
            >
              Work / Study role
            </label>
            <input
              id="profile-role"
              type="text"
              maxLength={80}
              value={workStudyRole}
              onChange={(e) => setWorkStudyRole(e.target.value)}
              placeholder="e.g. Software Engineer, Medical Student..."
              className="h-12 w-full rounded-xl border border-hairline bg-page px-3.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs text-red-600 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <PrimaryButton type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save changes'}
            </PrimaryButton>
          </div>
        </form>

        <AvatarPickerSheet
          isOpen={sheetOpen}
          userId={user.id}
          onClose={() => setSheetOpen(false)}
          onSelectAvatar={(url) => setAvatarUrl(url)}
        />
      </div>
    </AppShell>
  );
}

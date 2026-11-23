/**
 * 1. Purpose: Form section to configure reminder slot, web push, and daily email reminders.
 * 2. Spec Ref: Screen 89 Reminder time & notifications in Stitch UI Design Guide Category G.
 * 3. Called By: SettingsView.
 * 4. Calls: /api/account/settings and PrimaryButton.
 */

'use client';

import { useState } from 'react';
import { Bell, Clock, Mail } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/primary-button';

const reminderSlots = [
  { value: '06:00:00', label: '06:00 AM (Early)' },
  { value: '07:00:00', label: '07:00 AM' },
  { value: '08:00:00', label: '08:00 AM (Default)' },
  { value: '09:00:00', label: '09:00 AM' },
  { value: '10:00:00', label: '10:00 AM' },
  { value: '12:00:00', label: '12:00 PM (Noon)' },
  { value: '14:00:00', label: '02:00 PM' },
  { value: '16:00:00', label: '04:00 PM' },
  { value: '18:00:00', label: '06:00 PM' },
  { value: '20:00:00', label: '08:00 PM (Evening)' },
  { value: '21:00:00', label: '09:00 PM' },
  { value: '22:00:00', label: '10:00 PM' },
];

type NotificationsSectionProps = {
  initialTime?: string;
  initialPush?: boolean;
  initialEmail?: boolean;
};

export function NotificationsSection({
  initialTime = '08:00:00',
  initialPush = true,
  initialEmail = false,
}: Readonly<NotificationsSectionProps>) {
  const [reminderTime, setReminderTime] = useState(
    initialTime.length === 5 ? `${initialTime}:00` : initialTime
  );
  const [pushEnabled, setPushEnabled] = useState(initialPush);
  const [emailEnabled, setEmailEnabled] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSaved(false);

    try {
      const res = await fetch('/api/account/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_time: reminderTime,
          push_enabled: pushEnabled,
          email_reminders_enabled: emailEnabled,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update notification settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not save notifications'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-hairline bg-card p-5 md:p-6 space-y-4 shadow-none">
      <div className="border-b border-hairline pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Reminders &amp; notifications
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Screen 89 · Quiet daily reminders timed around your rhythm
        </p>
      </div>

      <div className="space-y-4">
        {/* Slot Picker */}
        <div>
          <label
            htmlFor="reminder-slot"
            className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-wider mb-2"
          >
            <Clock size={14} />
            <span>Daily reminder time (1-hour slot)</span>
          </label>
          <select
            id="reminder-slot"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="h-11 w-full rounded-xl border border-hairline bg-page px-3.5 text-sm text-ink focus:border-ink focus:outline-none cursor-pointer"
          >
            {reminderSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </div>

        {/* Web Push Toggle */}
        <div className="flex items-center justify-between border-t border-hairline pt-3">
          <div className="flex items-center gap-2.5">
            <Bell size={16} className="text-muted" />
            <div>
              <p className="text-sm font-medium text-ink">Web Push notifications</p>
              <p className="text-xs text-muted">
                Gentle nudge on working days if you haven&apos;t started
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pushEnabled}
            aria-label="Toggle push notifications"
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
              pushEnabled ? 'bg-[#1A1A1B] dark:bg-white' : 'bg-secondary-surface'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-card transition-transform duration-200 ${
                pushEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Daily Email Toggle */}
        <div className="flex items-center justify-between border-t border-hairline pt-3">
          <div className="flex items-center gap-2.5">
            <Mail size={16} className="text-muted" />
            <div>
              <p className="text-sm font-medium text-ink">Daily Email summary</p>
              <p className="text-xs text-muted">
                Send a morning email checklist for today&apos;s goal tasks
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailEnabled}
            aria-label="Toggle email reminders"
            onClick={() => setEmailEnabled(!emailEnabled)}
            className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
              emailEnabled ? 'bg-[#1A1A1B] dark:bg-white' : 'bg-secondary-surface'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-card transition-transform duration-200 ${
                emailEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        {saved && (
          <p className="text-xs text-green-600 dark:text-green-400">
            Preferences saved
          </p>
        )}

        <div className="pt-1">
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save notification settings'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

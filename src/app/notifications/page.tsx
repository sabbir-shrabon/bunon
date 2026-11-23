'use client';
/**
 * 1. Purpose: Displays Screen 78 Bell notices list for the last 30 days.
 * 2. Spec Ref: UI Design Guide Category G Screen 78.
 * 3. Called By: TopBar Bell icon.
 * 4. Calls: AppShell, next/link, and /api/notifications.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  target_screen: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setNotices(data.notifications || []);
        // Mark all as read
        fetch('/api/notifications', { method: 'PATCH' });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col w-full max-w-[640px] mx-auto px-5 pt-4 pb-12">
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary-surface text-ink cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">Notices</h1>
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted text-sm">Loading notices...</div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-secondary-surface flex items-center justify-center text-muted mb-3">
              <Bell size={20} />
            </div>
            <h2 className="text-[16px] font-semibold text-ink">Nothing new</h2>
            <p className="text-[13px] text-muted mt-1 max-w-[280px]">
              We will tell you here when your week is summarised or a milestone is reached.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-hairline bg-card rounded-[20px] border border-hairline overflow-hidden">
            {notices.map((n) => (
              <Link
                key={n.id}
                href={n.target_screen || '/today'}
                className="flex items-center justify-between p-4 hover:bg-secondary-surface transition-colors group"
              >
                <div className="flex flex-col gap-1 pr-3">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#FFB020] shrink-0" />
                    )}
                    <span className="text-[14px] font-semibold text-ink">{n.title}</span>
                  </div>
                  <p className="text-[13px] text-muted line-clamp-2">{n.body}</p>
                  <span className="text-[11px] text-[#8A8D94] mt-0.5">
                    {new Date(n.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted shrink-0 group-hover:text-ink" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

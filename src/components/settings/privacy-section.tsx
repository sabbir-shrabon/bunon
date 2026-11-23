/**
 * 1. Purpose: Privacy, data export, and account deletion section with Sheet 92 modal.
 * 2. Spec Ref: Screens 90–92 Privacy & data in Stitch UI Design Guide Category G.
 * 3. Called By: SettingsView.
 * 4. Calls: /api/account/export, /api/auth/delete-account, and BottomSheet.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';

export function PrivacySection() {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/account/export');
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bunon-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      alert('Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim() !== 'DELETE' || deleting) return;

    setDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Could not delete account');
      }

      setSheetOpen(false);
      router.replace('/today');
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error deleting account'
      );
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-hairline bg-card p-5 md:p-6 space-y-4 shadow-none">
      <div className="border-b border-hairline pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Privacy &amp; data
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Screens 90–92 · Inspect, export, or permanently wipe your information
        </p>
      </div>

      <div className="space-y-3">
        {/* Export Data Row */}
        <div className="flex items-center justify-between py-1">
          <div>
            <h3 className="text-sm font-medium text-ink">Export my data</h3>
            <p className="text-xs text-muted">
              Download your profile, goals, tasks, day notes, and evidence metadata in JSON
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-secondary-surface transition-colors cursor-pointer shrink-0 ml-3"
          >
            <Download size={14} className="text-muted" />
            <span>{exporting ? 'Exporting...' : 'Export JSON'}</span>
          </button>
        </div>

        <div className="h-[1px] w-full bg-hairline" />

        {/* Delete Account Row */}
        <div className="flex items-center justify-between py-1">
          <div>
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400">
              Delete my account
            </h3>
            <p className="text-xs text-muted">
              Permanently purges proof storage, database rows, and login credentials
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteInput('');
              setErrorMsg(null);
              setSheetOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/50 px-3.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/50 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 transition-colors cursor-pointer shrink-0 ml-3"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Sheet 92: Delete Account Confirmation */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Permanently delete account"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-3.5 text-xs leading-relaxed text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <strong>This action is immediate and cannot be undone.</strong> All
              goals, daily tasks, day notes, uploaded proof photos/files in Singapore
              storage, and Journey Cards will be permanently destroyed.
            </div>
          </div>

          <div>
            <label
              htmlFor="delete-confirm"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Type <strong className="text-ink">DELETE</strong> to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="h-11 w-full rounded-xl border border-hairline bg-page px-3.5 text-sm font-mono text-ink focus:border-red-500 focus:outline-none"
            />
          </div>

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteInput.trim() !== 'DELETE' || deleting}
              className="flex h-12 w-full items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              {deleting ? 'Deleting account...' : 'Permanently delete my account'}
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="w-full text-center text-xs text-muted hover:text-ink py-1 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

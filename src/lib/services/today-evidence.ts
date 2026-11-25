import 'server-only';
/**
 * 1. Purpose: Resolves completed task evidence rows and 1-hour signed proof URLs for the Today thread.
 * 2. Spec Ref: Database Schema v2.5 Section 5 & Screen 22 Thread Evidence Display.
 * 3. Called By: src/lib/services/today-service.ts.
 * 4. Calls: Admin Supabase client storage.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { TaskEvidenceItem } from '@/components/today/types';

export async function fetchDoneTasksEvidenceMap(
  admin: SupabaseClient<Database>,
  doneTaskIds: string[]
): Promise<Map<string, TaskEvidenceItem[]>> {
  const evidenceMap = new Map<string, TaskEvidenceItem[]>();
  if (doneTaskIds.length === 0) return evidenceMap;

  const { data: rawEvidence } = await admin
    .from('evidence')
    .select('id, task_id, type, storage_path, external_url, caption_note, file_size_bytes, uploaded_at')
    .in('task_id', doneTaskIds)
    .order('uploaded_at', { ascending: false });

  if (!rawEvidence || rawEvidence.length === 0) return evidenceMap;

  const resolved = await Promise.all(
    rawEvidence.map(async (row) => {
      let signedUrl: string | null = null;
      if (row.storage_path) {
        const normalized = row.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '');
        const { data: signed, error: signErr } = await admin.storage
          .from('bunon-proofs')
          .createSignedUrl(normalized, 3600);
        if (signErr) {
          console.error('[signed-url error]', { path: normalized, error: signErr });
        } else {
          signedUrl = signed?.signedUrl || null;
        }
      } else if (row.external_url) {
        signedUrl = row.external_url;
      }
      return {
        id: row.id,
        type: row.type,
        storage_path: row.storage_path,
        signed_url: signedUrl,
        external_url: row.external_url,
        caption_note: row.caption_note,
        file_size_bytes: Number(row.file_size_bytes) || 0,
        uploaded_at: row.uploaded_at,
        task_id: row.task_id,
      };
    })
  );

  for (const ev of resolved) {
    const list = evidenceMap.get(ev.task_id) || [];
    list.push(ev);
    evidenceMap.set(ev.task_id, list);
  }
  return evidenceMap;
}

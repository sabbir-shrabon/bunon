import 'server-only';
/**
 * 1. Purpose: Domain service for 100% free Journey Cards, public sharing, cheers, and goal chapters.
 * 2. Spec Ref: UI Design Guide Category H Screens 85-87, 97-103, and Pipeline 7.
 * 3. Called By: /api/journey/[slug]/cheer, /goals, /journey/[slug], and Journey Card components.
 * 4. Calls: Admin Supabase client and storage signed URL generator.
 */

import { createAdminClient } from '@/lib/db/admin';
import type { JourneyCardVisibility } from '@/types/domain';

interface JourneyCardDbRow {
  id: string;
  goal_id: string;
  user_id: string;
  public_slug: string;
  journey_card_headline: string;
  day1_vs_now_story: string;
  comeback_highlight_line: string | null;
  where_i_was_note: string | null;
  featured_evidence_ids: string[];
  next_goal_suggestions_json?: unknown[];
  visibility: JourneyCardVisibility;
  status: 'ACTIVE' | 'REVOKED';
  clap_count: number;
  issued_at: string;
  revoked_at: string | null;
  goals?: {
    id?: string;
    title: string;
    why: string;
    category: string;
    created_at: string;
    completed_at?: string;
    streak_weeks?: number;
  };
}

interface EvidenceUrlRow {
  id: string;
  storage_path: string | null;
  external_url: string | null;
  caption_note: string | null;
}

export async function getJourneyCard(userId: string, goalId: string) {
  const admin = createAdminClient();

  const { data: rawCard } = await admin
    .from('journey_cards')
    .select('*, goals(id, title, why, category, created_at, completed_at, streak_weeks)')
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!rawCard) return null;
  const card = rawCard as unknown as JourneyCardDbRow;

  const featuredEvidence: Array<{ id: string; url: string; caption?: string }> = [];
  if (card.featured_evidence_ids?.length) {
    const { data: rawRows } = await admin
      .from('evidence')
      .select('id, storage_path, external_url, caption_note')
      .in('id', card.featured_evidence_ids);

    const evidenceRows = (rawRows || []) as unknown as EvidenceUrlRow[];

    for (const row of evidenceRows) {
      let url = row.external_url || '';
      if (row.storage_path) {
        const normalizedPath = row.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '');
        const { data: signed, error: signErr } = await admin.storage
          .from('bunon-proofs')
          .createSignedUrl(normalizedPath, 3600);
        if (signErr) {
          console.error('[signed-url error]', { path: normalizedPath, error: signErr });
        } else if (signed?.signedUrl) {
          url = signed.signedUrl;
        }
      }
      featuredEvidence.push({ id: row.id, url, caption: row.caption_note || undefined });
    }
  }

  const { data: profile } = await admin
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .single();

  return {
    ...card,
    userName: profile?.name || profile?.email?.split('@')[0] || 'Bunon user',
    featuredEvidence,
  };
}

export async function getPublicJourneyCard(slug: string) {
  const admin = createAdminClient();

  const { data: rawCard } = await admin
    .from('journey_cards')
    .select('*, goals(title, why, category, created_at, completed_at)')
    .eq('public_slug', slug)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!rawCard) return null;
  const card = rawCard as unknown as JourneyCardDbRow;
  if (card.visibility === 'PRIVATE') return null;

  const featuredEvidence: Array<{ id: string; url: string; caption?: string }> = [];
  if (card.featured_evidence_ids?.length) {
    const { data: rawRows } = await admin
      .from('evidence')
      .select('id, storage_path, external_url, caption_note')
      .in('id', card.featured_evidence_ids);

    const evidenceRows = (rawRows || []) as unknown as EvidenceUrlRow[];

    for (const row of evidenceRows) {
      let url = row.external_url || '';
      if (row.storage_path) {
        const normalizedPath = row.storage_path.replace(/^\/+/, '').replace(/^bunon-proofs\//, '');
        const { data: signed, error: signErr } = await admin.storage
          .from('bunon-proofs')
          .createSignedUrl(normalizedPath, 3600);
        if (signErr) {
          console.error('[signed-url error]', { path: normalizedPath, error: signErr });
        } else if (signed?.signedUrl) {
          url = signed.signedUrl;
        }
      }
      featuredEvidence.push({ id: row.id, url, caption: row.caption_note || undefined });
    }
  }

  const { data: profile } = await admin
    .from('users')
    .select('name')
    .eq('id', card.user_id)
    .single();

  return {
    ...card,
    userName: profile?.name || 'A Bunon Achiever',
    featuredEvidence,
  };
}

export async function updateJourneyCard(
  userId: string,
  journeyCardId: string,
  updates: {
    visibility?: JourneyCardVisibility;
    featured_evidence_ids?: string[];
    where_i_was_note?: string;
  }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('journey_cards')
    .update(updates)
    .eq('id', journeyCardId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}

export async function cheerJourneyCard(slug: string) {
  const admin = createAdminClient();
  const { data: card } = await admin
    .from('journey_cards')
    .select('id, clap_count')
    .eq('public_slug', slug)
    .single();

  if (!card) throw new Error('Journey Card not found');

  const newClap = (card.clap_count || 0) + 1;
  await admin.from('journey_cards').update({ clap_count: newClap }).eq('id', card.id);
  return { success: true, clapCount: newClap };
}

export async function getUserGoals(userId: string) {
  const admin = createAdminClient();

  const { data: goals } = await admin
    .from('goals')
    .select('id, title, why, status, created_at, deadline, completed_at, execution_mode, plan_style')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const { data: milestones } = await admin
    .from('milestones')
    .select('id, goal_id, status')
    .eq('status', 'UPCOMING');

  const { data: journeyCards } = await admin
    .from('journey_cards')
    .select('id, goal_id, public_slug, journey_card_headline')
    .eq('user_id', userId);

  const cardMap = new Map((journeyCards || []).map((jc) => [jc.goal_id, jc]));
  const upcomingCountMap = new Map<string, number>();
  (milestones || []).forEach((m) => {
    upcomingCountMap.set(m.goal_id, (upcomingCountMap.get(m.goal_id) || 0) + 1);
  });

  const enriched = (goals || []).map((g) => ({
    ...g,
    upcomingMilestonesLeft: upcomingCountMap.get(g.id) || 0,
    journeyCard: cardMap.get(g.id) || null,
  }));

  return enriched;
}

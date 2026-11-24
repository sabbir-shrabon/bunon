import 'server-only';
/**
 * 1. Purpose: Idempotent domain service for Pipeline 7 goal completion and Journey Card issuance.
 * 2. Spec Ref: UI Design Guide Category H Screens 97-103 and Pipeline 7.
 * 3. Called By: week-rollover-service.ts planNextWeek.
 * 4. Calls: Admin Supabase client, Pipeline 7, and AI firewall.
 */

import { createAdminClient } from '@/lib/db/admin';
import { executeAIPipeline } from '@/lib/ai/assembler';
import { AIFirewallError, checkAIFirewall } from '@/lib/ai/firewall';
import {
  Pipeline7NextGoalBridgeSchema,
  type Pipeline7Output,
} from '@/types/ai-schemas';
import type { GoalRow, MilestoneRow, TaskRow } from '@/types/db/goal-tables';

export interface CompleteGoalParams {
  userId: string;
  goal: GoalRow;
  allMilestones: MilestoneRow[];
  completedTasks: TaskRow[];
  contextPack: unknown;
  weeklyReviewId: string;
}

export async function completeGoalWithJourneyCard(params: CompleteGoalParams) {
  const { userId, goal, allMilestones, completedTasks, contextPack, weeklyReviewId } = params;
  const admin = createAdminClient();

  const { data: existingCard } = await admin
    .from('journey_cards')
    .select('public_slug')
    .eq('goal_id', goal.id)
    .maybeSingle();

  if (existingCard?.public_slug) {
    if (goal.status !== 'COMPLETED') {
      await admin
        .from('goals')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
        })
        .eq('id', goal.id);
    }
    return {
      weeklyReviewId,
      isGoalCompleted: true,
      journeyCardSlug: existingCard.public_slug,
    };
  }

  const { data: proofs } = await admin
    .from('evidence')
    .select('id, uploaded_at')
    .eq('goal_id', goal.id)
    .order('uploaded_at', { ascending: true });

  const evidenceList = proofs || [];
  const firstProofId = evidenceList[0]?.id;
  const lastProofId = evidenceList[evidenceList.length - 1]?.id;
  const featuredEvidenceIds = [firstProofId, lastProofId].filter(Boolean) as string[];

  const { data: user } = await admin
    .from('users')
    .select('language, country')
    .eq('id', userId)
    .single();

  const firewall7 = await checkAIFirewall({ userId, pipeline: 'PIPELINE_7', goalId: goal.id });
  if (!firewall7.allowed) {
    throw new AIFirewallError(firewall7.reason || 'FIREWALL_BLOCKED', firewall7.retryAfterSeconds);
  }

  const p7Output = await executeAIPipeline<Pipeline7Output>(
    {
      pipeline: 'PIPELINE_7',
      userId,
      goalId: goal.id,
      model: firewall7.model,
      language: (user?.language as 'EN' | 'BN') || 'EN',
      country: user?.country || 'BD',
      category: goal.category,
      variables: {
        goal_title: goal.title,
        goal_why: goal.why,
        goal_category: goal.category,
        execution_mode: goal.execution_mode,
        total_weeks: goal.current_week_number,
        active_days_count: completedTasks.length,
        current_baseline: goal.current_baseline_text,
        completed_milestones_json: allMilestones,
        top_proofs_summary_json: evidenceList.slice(0, 5),
        comeback_weeks_count: 0,
        context_pack_json: contextPack,
      },
    },
    Pipeline7NextGoalBridgeSchema
  );

  const publicSlug = `j_${Math.random().toString(36).slice(2, 10)}`;
  await admin.from('journey_cards').insert({
    goal_id: goal.id,
    user_id: userId,
    public_slug: publicSlug,
    journey_card_headline: p7Output.journey_card_headline,
    day1_vs_now_story: p7Output.day1_vs_now_story,
    comeback_highlight_line: p7Output.comeback_highlight_line || null,
    featured_evidence_ids: featuredEvidenceIds,
    next_goal_suggestions_json: p7Output.next_goal_suggestions,
    visibility: 'PRIVATE',
    status: 'ACTIVE',
  });

  await admin
    .from('goals')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    })
    .eq('id', goal.id);

  await admin.from('notifications').insert({
    user_id: userId,
    type: 'JOURNEY_CARD_EARNED',
    title: 'Journey Card Earned! 🎓',
    body: `You completed ${goal.title}! Your 100% free Journey Card is ready to share.`,
    target_screen: `/journey/${publicSlug}`,
  });

  return {
    weeklyReviewId,
    isGoalCompleted: true,
    journeyCardSlug: publicSlug,
  };
}

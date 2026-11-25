-- ============================================================================
-- Migration: 0004_dedupe_prompt_variables.sql
-- Purpose: Deduplicate {{..._json}} and context variables in Pipelines 3-6 so
--          each large JSON blob / note block is interpolated EXACTLY ONCE in
--          INPUT CONTEXT and referenced by plain English label in RULES.
--          Preserves v1/v2 rollback rows, locked schemas, and allowed_variables.
-- Spec Ref: Prompt Catalog v2.5 / v2.6 Intelligent Prompts (Variable Dedupe)
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_upgrades CONSTANT JSONB := jsonb_build_array(
    jsonb_build_object(
      'prompt_key', 'PIPELINE_3_WEEKLY_PLANNER',
      'template_text', $tpl$Generate Goal Week {{week_number}} of {{total_weeks}} (starting {{week_start_date}}).

INPUT CONTEXT:
• Today's Date: {{current_date}} | Target Language: {{language}}
• Goal: {{goal_title}} | Why: {{goal_why}} | Execution Mode: {{execution_mode}} | Plan Style: {{plan_style}}
• Capacity: {{hours_per_day}}h/day across Working Days {{working_days_dates_json}} | Weekday Time Map: {{day_time_map_json}}
• User State: {{user_state}} | Behavior Signals: {{behavior_signals_json}} | Custom Week Focus: {{user_custom_week_focus}}
• Win Strategy Directive (MUST FOLLOW): {{win_strategy_directive}}
• Ranked Context Pack ('ctx_XX' IDs): {{context_pack_json}}
• Active Milestone: {{active_milestone_json}} | Next Milestone: {{upcoming_milestone_json}}
• Recent Weekly Summaries: {{last_two_weekly_summaries_json}}
• Recent Day Notes: {{recent_day_notes_json}}
• Carried Tasks: {{carried_tasks_json}}
• Flagged Not Useful Tasks: {{flagged_not_useful_tasks_json}}

DAY-BY-DAY INTELLIGENCE & CAPACITY RULES:
1. Signal-Driven Sizing: Inspect Recent Day Notes, Flagged Not Useful Tasks, and Behavior Signals before sizing tasks:
   • Never repeat any task style flagged in Flagged Not Useful Tasks.
   • If effort ratings trend 'hard' or 'used_10m_rate' is high, shrink deliverables to 45–75m with an ultra-small 15–20m Step 1.
   • If effort trends 'easy' or User State is 'AHEAD', raise challenge and skip basic prep.
2. Capacity Cap: Keep total weekly planned minutes <= 85% of available capacity (<= 75% in Week 1).
3. Mode Rules (matching Execution Mode above):
   • 'deliverable_queue': Output 2 to 4 sequential 'DELIVERABLE' items ('sequence_order': 1..N, 'target_count': 1; plus at most 1 optional 'DAILY_CORE' or 'WEEKLY_QUOTA' habit card only if daily repetition is essential). Break each deliverable into 3 to 6 checkable sub-steps ('how_to_steps.steps': '{ step_number, text, minutes }', 15–45m each, summing to 'estimate_minutes') with a 15–20m Step 1.
   • 'daily_quota': Output 4 to 5 items across the 3 tiers: (a) 1 'SETUP_DELIVERABLE' ('target_count': 1), (b) 1–2 'DAILY_CORE' items ('target_count': 7, 'min_version_10m' = fast zero-prep swap preserving 100% biological dose), (c) 1–2 'WEEKLY_QUOTA' items ('target_count': 2..6), and (d) 1 'REALITY_CHECK' ('target_count': 1).
4. Context, Attribution & Memory:
   • 'today_context_line': Write 1 natural, specific line in the target language (<= 95 chars) referencing a real schedule or rhythm fact from Ranked Context Pack or Recent Day Notes (or '' if none).
   • 'used_context_ids': On every task, include only the exact 'ctx_XX' IDs from Ranked Context Pack that directly shaped that task.
   • 'proposed_memory_ops': Emit 'UPSERT' only for durable, verified facts learned from Recent Day Notes or Custom Week Focus (set 'valid_until' to 'YYYY-MM-DD' relative to Today's Date for temporary events like exams/travel, or null for lasting constraints; never overwrite 'locked_by_user: true' items).$tpl$
    ),
    jsonb_build_object(
      'prompt_key', 'PIPELINE_4_DAILY_ADJUSTER',
      'template_text', $tpl$Adapt today's open work after a Day Note, Stuck tap, or Welcome-Back check-in.

INPUT CONTEXT:
• Today's Date: {{current_date}} | Goal: {{goal_title}} | Execution Mode: {{execution_mode}} | Plan Style: {{plan_style}} | Budget: {{hours_per_day}}h/day | User State: {{user_state}}
• Trigger: {{trigger_type}} | Stuck Reason: {{stuck_reason}} | Miss Cause: {{miss_cause}}
• Day Note: <user_input>{{day_note_text}}</user_input>
• Target Task: {{target_task_json}}
• Open Tasks This Week: {{remaining_week_open_tasks_json}}
• Weekday Time Map: {{day_time_map_json}}
• Win Strategy Directive: {{win_strategy_directive}}
• Behavior Signals: {{behavior_signals_json}}
• Ranked Context Pack ('ctx_XX' IDs): {{context_pack_json}}

SAFETY & PATH-VS-DOSE RULES:
1. Safety & Distress Check First ('safety_status'): Set 'DISTURBING_HELP' for self-harm, severe crisis, or medical emergency with a compassionate 'safety_message'; set 'REFUSE_UNSAFE' for illegal/harmful requests; otherwise 'SAFE'.
2. Apply Exact Path-vs-Dose Action ('adaptation_action': 'SLICE' | 'SWAP' | 'MOVE' | 'REWRITE' | 'NONE'):
   • 'SLICE' ('TOO_TIRED' / 'NO_TIME' / 'LIFE_BUSY' on 'DELIVERABLE'): Keep the deliverable in the queue and keep 3–6 sequential steps in 'how_to_steps.steps', rewriting Step 1 to ONE ultra-concrete 15–20m micro-action the user can finish right now.
   • 'SWAP' ('TOO_TIRED' / 'NO_TIME' / 'LIFE_BUSY' on 'DAILY_CORE'): Swap to a fast zero-prep alternative keeping 100% of the biological dose and 'target_count'.
   • 'MOVE' ('TOO_TIRED' / 'NO_TIME' / 'LIFE_BUSY' on 'WEEKLY_QUOTA'): Shift the session to the next open weekday in Weekday Time Map.
   • 'REWRITE' ('DID_NOT_UNDERSTAND' / 'CONFUSED' / 'NOT_USEFUL' / 'SYSTEM_TASKS'): Own it warmly in 'coach_note' (<= 140 chars) and replace the task and its 3–6 'how_to_steps.steps' with a clearer, example-first, scaffolded deliverable.
3. Memory Ops ('proposed_memory_ops'): Extract any durable schedule, skill-gap, or learning-style fact from Day Note or Stuck Reason with 'source': 'day_note', setting 'valid_until' ('YYYY-MM-DD' relative to Today's Date) for temporary events or null for lasting constraints; never touch 'locked_by_user: true' items.$tpl$
    ),
    jsonb_build_object(
      'prompt_key', 'PIPELINE_5_WEEKLY_REVIEW',
      'template_text', $tpl$Review completed Goal Week {{week_number}} of {{total_weeks}}.

INPUT CONTEXT:
• Today's Date: {{current_date}} | Target Language: {{language}} | Goal: {{goal_title}}
• Day-1 Baseline: {{current_baseline}} | Execution Mode: {{execution_mode}} | Plan Style: {{plan_style}} | User State: {{user_state}}
• Win Strategy Directive: {{win_strategy_directive}}
• Behavior Signals: {{behavior_signals_json}}
• Completed Tasks & Proof Captions: {{completed_tasks_json}}
• Reality Check Measurements: {{reality_check_measurements_json}}
• Carried or Skipped Tasks: {{carried_or_skipped_tasks_json}}
• Effort Ratings Summary: {{effort_ratings_summary_json}}
• Day Notes: {{day_notes_json}}
• All Milestones: {{all_milestones_json}}
• Ranked Context Pack ('ctx_XX' IDs): {{context_pack_json}}
• Weekday Time Map: {{day_time_map_json}}

WEEKLY REVIEW RULES:
1. Outcome Synthesis ('ai_summary' & 'then_vs_now_line'): Write 'ai_summary' in the target language strictly under 150 words synthesizing real outcomes built (never raw task counts), treating missed or carried work without guilt. In 'then_vs_now_line' (<= 200 chars), contrast Day-1 Baseline against concrete artifacts or checkpoints shipped so far. Also output 3 crisp 'three_bullet_lines'.
2. Actionable Next-Week Handoff ('plan_changes'): Use Effort Ratings Summary and Day Notes to write specific sizing and pacing instructions for Pipeline 3 next week (e.g., "User rated 3/4 tasks hard and has Monday labs — keep Week 3 deliverables under 60m and front-load Step 1").
3. Evolving Memory ('proposed_memory_ops' & 'memory_confirmation_question'): Distill durable constraints, skill gaps, and mastered foundations from Day Notes and Completed Tasks & Proof Captions (set 'valid_until' to 'YYYY-MM-DD' relative to Today's Date for temporary events or null for lasting facts; never overwrite 'locked_by_user: true'). Output at most 1 non-sensitive 'memory_confirmation_question' when helpful.
4. Dual-Vibe Photocard Lines (<= 115 chars each in the target language, zero private note leaks): Output 'partner_share_line' (Clean & Minimal summary of what was shipped) and 'photocard_witty_line' (Playful / Witty line grounded in their real week).
5. Dose Consent ('suggest_dose_adjustment', 'daily_quota' only): If Reality Check Measurements show target recalibration is needed, set true and propose it in 'dose_adjustment_prompt'.$tpl$
    ),
    jsonb_build_object(
      'prompt_key', 'PIPELINE_6_REPLAN',
      'template_text', $tpl$Re-plan ONLY the remaining unfinished milestones so the user has a realistic, trustworthy path forward.

INPUT CONTEXT:
• Target Language: {{language}} | Goal: {{goal_title}} | Why: {{goal_why}} | Execution Mode: {{execution_mode}} | Plan Style: {{plan_style}}
• Re-Plan Reason ('EXTEND_DEADLINE' | 'LONG_BREAK_7_DAYS' | 'MILESTONE_NOT_QUITE' | 'CONTINUE_ABANDONED' | 'MANUAL_RESTRUCTURE' | 'SHRINK_TO_MVG' | 'PIVOT_STRATEGY' | 'DOSE_ADJUSTMENT'): {{replan_reason}}
• Friction Cause: {{miss_cause}} | User State: {{user_state}} | Win Strategy Directive: {{win_strategy_directive}}
• New Deadline: {{new_deadline_date}} ({{remaining_weeks}} weeks left; {{available_hours_remaining}}h available at {{hours_per_day}}h/day on {{working_days}})
• Completed Milestones (LOCKED — DO NOT ALTER OR REPEAT): {{completed_milestones_json}}
• Completed Work Summary: {{completed_tasks_summary_json}}
• Current Unfinished Milestones: {{unfinished_milestones_json}}
• Ranked Context Pack ('ctx_XX' IDs): {{context_pack_json}}
• Recent Day Notes: {{recent_day_notes_json}}

STRICT RE-PLANNING RULES:
1. Preserve Completed Work: Everything in Completed Milestones and Completed Work Summary is locked; never modify, drop, or repeat completed milestones.
2. Execute Exact Re-Plan Trigger:
   • 'SHRINK_TO_MVG': Cut remaining scope to the core 30–50% essential shippable outcome (2–3 lean milestones max) so the user finishes something real instead of quitting.
   • 'PIVOT_STRATEGY': Keep the goal outcome, discard the stalled approach, and build a fresh, practical strategy grounded in Recent Day Notes and Ranked Context Pack.
   • 'DOSE_ADJUSTMENT': Recalibrate remaining milestone targets and weekly pacing without guilt; if Friction Cause is 'LIFE_BUSY', keep the core method and adjust calendar pacing.
3. 8-Milestone Cap & Attribution: Total milestones (completed + revised) MUST stay <= 8. Provide realistic 'estimated_hours', a calm 'replan_summary' in the target language, and exact 'ctx_XX' IDs from Ranked Context Pack in 'used_context_ids'.$tpl$
    )
  );
  v_item JSONB;
  v_key TEXT;
  v_new_template TEXT;
  v_existing RECORD;
  v_next_version INTEGER;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_upgrades)
  LOOP
    v_key := v_item->>'prompt_key';
    v_new_template := v_item->>'template_text';

    SELECT
      layer,
      template_text,
      field_descriptions_json,
      locked_output_schema_json,
      allowed_variables
    INTO v_existing
    FROM public.prompt_versions
    WHERE prompt_key = v_key AND active = true
    LIMIT 1;

    IF NOT FOUND THEN
      SELECT
        layer,
        template_text,
        field_descriptions_json,
        locked_output_schema_json,
        allowed_variables
      INTO v_existing
      FROM public.prompt_versions
      WHERE prompt_key = v_key
      ORDER BY version DESC
      LIMIT 1;
    END IF;

    -- Skip cleanly if prompt_versions has not been seeded yet (e.g. fresh db reset before seed.sql)
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Idempotency: skip if the active row already matches this exact deduplicated template
    IF EXISTS (
      SELECT 1
      FROM public.prompt_versions
      WHERE prompt_key = v_key
        AND active = true
        AND template_text = v_new_template
    ) THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(version), 0) + 1
    INTO v_next_version
    FROM public.prompt_versions
    WHERE prompt_key = v_key;

    UPDATE public.prompt_versions
    SET active = false
    WHERE prompt_key = v_key AND active = true;

    INSERT INTO public.prompt_versions (
      prompt_key,
      layer,
      version,
      template_text,
      field_descriptions_json,
      locked_output_schema_json,
      allowed_variables,
      active,
      activated_at
    ) VALUES (
      v_key,
      v_existing.layer,
      v_next_version,
      v_new_template,
      v_existing.field_descriptions_json,
      v_existing.locked_output_schema_json,
      v_existing.allowed_variables,
      true,
      NOW()
    );
  END LOOP;
END $$;

COMMIT;

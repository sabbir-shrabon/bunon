-- ============================================================================
-- Migration: 0002_onboarding_context_ingest.sql
-- Purpose: Add Two-Path User-Owned Onboarding schema extensions & Prompt #16
-- Spec Ref: Database Schema v2.5 (goals, system_settings, ai_calls) & Prompt Catalog v2.5
-- ============================================================================

-- 1. Extend public.goals table with outline_mode and extracted_outline_summary
ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS outline_mode TEXT NOT NULL DEFAULT 'BACKGROUND_CONTEXT';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_outline_mode_check'
  ) THEN
    ALTER TABLE public.goals 
      ADD CONSTRAINT goals_outline_mode_check 
      CHECK (outline_mode IN ('FOLLOW_OUTLINE', 'BACKGROUND_CONTEXT'));
  END IF;
END $$;

ALTER TABLE public.goals 
  ADD COLUMN IF NOT EXISTS extracted_outline_summary VARCHAR(1500) NULL;

-- 2. Extend public.system_settings table with onboarding context limits
ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS onboarding_context_max_files SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE public.system_settings 
  ADD COLUMN IF NOT EXISTS onboarding_context_max_file_size_bytes BIGINT NOT NULL DEFAULT 5242880;

-- 3. Update pipeline_models_json on system_settings row (id = 1) to configure PIPELINE_1B
UPDATE public.system_settings
SET pipeline_models_json = pipeline_models_json || '{"PIPELINE_1B": "gemini-3.5-flash-lite"}'::jsonb
WHERE id = 1 AND NOT (pipeline_models_json ? 'PIPELINE_1B');

-- 4. Update public.ai_calls check constraint so 'PIPELINE_1B' is permitted
DO $$
BEGIN
  ALTER TABLE public.ai_calls DROP CONSTRAINT IF EXISTS ai_calls_pipeline_check;
  ALTER TABLE public.ai_calls ADD CONSTRAINT ai_calls_pipeline_check
    CHECK (pipeline IN ('PIPELINE_1', 'PIPELINE_1B', 'PIPELINE_2', 'PIPELINE_3', 'PIPELINE_4', 'PIPELINE_5', 'PIPELINE_6', 'PIPELINE_7'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 5. Insert Prompt #16 (PIPELINE_1B_FILE_CONTEXT_INGEST)
INSERT INTO public.prompt_versions (
  prompt_key,
  layer,
  version,
  template_text,
  field_descriptions_json,
  locked_output_schema_json,
  allowed_variables,
  active
) VALUES (
  'PIPELINE_1B_FILE_CONTEXT_INGEST',
  'PIPELINE',
  1,
  'Read the user''s attached file or notes carefully and turn THEIR own material into a clean, user-owned starting brief for Bunon. Never overwrite or invent goals that contradict what the user provided.

INPUT CONTEXT:
• Outline Mode (FOLLOW_OUTLINE | BACKGROUND_CONTEXT): {{outline_mode}}
• Deadline & Schedule: {{deadline_date}} ({{total_weeks}} weeks, {{working_days}} at {{hours_per_day}}h/day)
• Existing ''What Bunon Knows'' Profile: {{person_memory_json}}
• User''s Attached File / Notes: <user_input>{{pasted_or_extracted_text}}</user_input>

INSTRUCTIONS:
1. Safety & Distress Check First (safety_status): Set ''DISTURBING_HELP'' for self-harm/crisis/medical emergency, ''REFUSE_UNSAFE'' for illegal/harmful goals, else ''SAFE''.
2. Extract User-Owned Goal Brief: Extract concise extracted_goal_title (<= 120 chars), extracted_goal_why (<= 250 chars), extracted_baseline (<= 300 chars), extracted_constraints (<= 250 chars), and condensed_outline_summary (<= 1,400 chars preserving the user''s exact chapter/topic order when outline_mode = FOLLOW_OUTLINE).
3. Extract 3 to 6 Editable ''What Bunon Understood'' Facts (extracted_memory_facts): Pull 3–6 crisp, plain-language facts (scope: ''PERSON'' | ''GOAL'') shown directly as editable chips on Screen 17 so the user stays in full control of what Bunon knows from Day 1.
4. Detect Category, Execution Mode & 0–2 Conditional Follow-Ups: Choose detected_category from {{active_categories_list}}, execution_mode, and recommended_plan_style. Output 0 to 2 followup_questions ONLY if critical info is genuinely missing; return [] if the file already gives enough to build a strong Roadmap.',
  '{"safety_status":"SAFE, REFUSE_UNSAFE, or DISTURBING_HELP","safety_message":"Compassionate plain message if DISTURBING_HELP or REFUSE_UNSAFE, otherwise empty string","detected_category":"Detected category from active categories list","execution_mode":"deliverable_queue or daily_quota","recommended_plan_style":"FLEXIBLE_WEEK or DAILY_ADAPTIVE","extracted_goal_title":"Concise user-owned goal title (max 120 chars)","extracted_goal_why":"Why this goal matters (max 250 chars)","extracted_baseline":"Current starting baseline (max 300 chars)","extracted_constraints":"Life constraints or schedule limitations (max 250 chars)","condensed_outline_summary":"Structured summary of user topics/chapters (max 1,400 chars, preserving sequence if FOLLOW_OUTLINE)","extracted_memory_facts":"Array of 3 to 6 editable memory facts with scope, bucket, and fact","followup_questions":"Array of 0 to 2 conditional clarifying questions if critical info is missing"}'::jsonb,
  '{"type":"object","required":["safety_status","safety_message","detected_category","execution_mode","recommended_plan_style","extracted_goal_title","extracted_goal_why","extracted_baseline","extracted_constraints","condensed_outline_summary","extracted_memory_facts","followup_questions"],"properties":{"safety_status":{"type":"string","enum":["SAFE","REFUSE_UNSAFE","DISTURBING_HELP"]},"safety_message":{"type":"string"},"detected_category":{"type":"string"},"execution_mode":{"type":"string","enum":["deliverable_queue","daily_quota"]},"recommended_plan_style":{"type":"string","enum":["FLEXIBLE_WEEK","DAILY_ADAPTIVE"]},"extracted_goal_title":{"type":"string"},"extracted_goal_why":{"type":"string"},"extracted_baseline":{"type":"string"},"extracted_constraints":{"type":"string"},"condensed_outline_summary":{"type":"string"},"extracted_memory_facts":{"type":"array","items":{"type":"object","required":["scope","bucket","fact"],"properties":{"scope":{"type":"string","enum":["PERSON","GOAL"]},"bucket":{"type":"string","enum":["knowledge_and_skill_gaps","life_rhythm_and_constraints","what_works_for_this_user","mastered_foundations","past_pivots_and_decisions"]},"fact":{"type":"string"}}}},"followup_questions":{"type":"array","items":{"type":"object","required":["question","why_we_ask","quick_chips"],"properties":{"question":{"type":"string"},"why_we_ask":{"type":"string"},"quick_chips":{"type":"array","items":{"type":"string"}}}}}}}'::jsonb,
  ARRAY['language', 'user_birth_year', 'user_country', 'outline_mode', 'deadline_date', 'total_weeks', 'working_days', 'hours_per_day', 'pasted_or_extracted_text', 'person_memory_json', 'active_categories_list'],
  true
)
ON CONFLICT (prompt_key) WHERE active = true
DO UPDATE SET
  template_text = EXCLUDED.template_text,
  field_descriptions_json = EXCLUDED.field_descriptions_json,
  locked_output_schema_json = EXCLUDED.locked_output_schema_json,
  allowed_variables = EXCLUDED.allowed_variables,
  active = true;

-- 6. Update active PIPELINE_2_ROADMAP_GENERATOR row in prompt_versions
UPDATE public.prompt_versions
SET
  template_text = 'Build a complete, realistic Milestone Roadmap for the user''s goal based on all of their onboarding answers and ranked ''What Bunon knows'' context pack.

USER CONTEXT:
• Goal: {{goal_title}} (Category: {{goal_category}} | Execution Mode: {{execution_mode}} | Plan Style: {{plan_style}})
• Why it matters: {{goal_why}} | Starting baseline (Day 1): {{current_baseline}} | Constraints: {{constraints}}
• Deadline: {{deadline_date}} ({{total_weeks}} calendar weeks; Total available working hours: {{available_hours_total}}h at {{hours_per_day}}h/day on {{working_days}})
• Ranked ''What Bunon Knows'' Context Pack (with IDs ''ctx_01''..): {{context_pack_json}} | Follow-up Q&A: {{followup_qa_json}}
• Optional Regeneration Feedback (if user tapped ''This doesn''t fit me'' on Screen 17): {{regeneration_feedback_reason}}
• Outline Mode (FOLLOW_OUTLINE vs. BACKGROUND_CONTEXT) & Extracted Outline: {{outline_mode}} | {{extracted_outline_summary}}

ROADMAP RULES:
0. Respect User''s Own Outline (FOLLOW_OUTLINE): If {{outline_mode}} is ''FOLLOW_OUTLINE'' and {{extracted_outline_summary}} is non-empty, strictly preserve the user''s chapters, topics, and sequence across the 4–8 milestones so the plan clearly feels like THEIR own plan structured for finishing.
1. Milestone Count & No Fake Prep Milestones: Generate 4 to 8 sequential milestones (''position'' 1..8). NEVER make Milestone 1 a pure ''research, setup, or planning'' milestone—Milestone 1 must produce a visible real-world result or measurable baseline shift within the first 1–2 weeks.
2. Align with Execution Mode (''{{execution_mode}}''):
   • If ''deliverable_queue'': Each milestone''s ''expected_result'' must be a concrete finished artifact, module, customer validation batch, or solved problem set.
   • If ''daily_quota'': Each milestone''s ''expected_result'' must pair a progressive weekly habit/training/nutrition standard with a measurable physical or skill checkpoint (''target_metric_value'' and ''target_metric_unit'').
3. Honest Estimated Hours & Context Attribution (''used_context_ids''): Provide realistic ''estimated_hours'' for the 85% feasibility check, and return the exact ''ctx_XX'' IDs from ''{{context_pack_json}}'' that shaped this roadmap in ''used_context_ids'' so Screen 17 can show ''This plan used [N] things Bunon knows about you''.',
  allowed_variables = ARRAY['language', 'goal_title', 'goal_why', 'goal_category', 'execution_mode', 'plan_style', 'outline_mode', 'extracted_outline_summary', 'deadline_date', 'total_weeks', 'working_days', 'hours_per_day', 'available_hours_total', 'current_baseline', 'constraints', 'context_pack_json', 'followup_qa_json', 'regeneration_feedback_reason']
WHERE prompt_key = 'PIPELINE_2_ROADMAP_GENERATOR' AND active = true;

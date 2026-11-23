import 'server-only';
/**
 * 1. Purpose: Assembles 4 prompt layers, calls Google Gemini, validates JSON, and records telemetry.
 * 2. Spec Ref: Prompt Catalog v2.5 Sections 1–7 & Database Schema Section 2.
 * 3. Called By: Pipeline runners in Next.js API routes and server services.
 * 4. Calls: @google/genai, Admin Supabase client, Zod schemas, and context-pack.
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/admin';
import type { AIPipelineKey } from '@/types/domain';
import {
  DEFAULT_REGIONAL_BD_CONTEXT,
  DEFAULT_REGIONAL_GLOBAL_CONTEXT,
} from './regional-constants';

export interface PromptAssemblyContext {
  pipeline: AIPipelineKey;
  userId?: string | null;
  goalId?: string | null;
  model: string;
  language: 'EN' | 'BN';
  country?: string;
  category?: string;
  variables: Record<string, string | number | boolean | unknown>;
  responseSchema?: Record<string, unknown>;
}

export function renderVariables(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
    const val = variables[key];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });
}

function calculateCostUsd(tokensIn: number, tokensOut: number, model: string): number {
  const isLite = model.includes('lite');
  const rateIn = isLite ? 0.075 / 1000000 : 0.15 / 1000000;
  const rateOut = isLite ? 0.3 / 1000000 : 0.6 / 1000000;
  return tokensIn * rateIn + tokensOut * rateOut;
}

const DEFAULT_PIPELINE_PROMPTS: Record<AIPipelineKey, string> = {
  PIPELINE_1: 'Analyze goal {{goal_title}} in category {{detected_category}}. Ask up to 3 follow-up questions.',
  PIPELINE_2: 'Generate 4-8 milestones for {{goal_title}} (baseline: {{current_baseline}}).',
  PIPELINE_3: 'Generate week {{week_number}} tasks for {{goal_title}} under active milestone {{active_milestone_json}}.',
  PIPELINE_4: 'Adapt tasks for {{goal_title}} given trigger {{trigger_type}} and stuck reason {{stuck_reason}}.',
  PIPELINE_5: 'Summarize completed week {{week_number}} for {{goal_title}} (baseline: {{current_baseline}}). Output ai_summary under 150 words, 3 three_bullet_lines, then_vs_now_line, partner_share_line (Clean & Minimal), photocard_witty_line (Playful / Witty), on_track, and milestone_competency_updates.',
  PIPELINE_6: 'Re-plan remaining unfinished milestones for {{goal_title}}. Reason: {{replan_reason}}. Completed milestones: {{completed_milestones_json}}. Unfinished: {{unfinished_milestones_json}}.',
  PIPELINE_7: 'Generate Journey Card copy and 3 Next Chapter goal suggestions for finished goal {{goal_title}}. Why: {{goal_why}}, Day-1 baseline: {{current_baseline}}, proofs: {{top_proofs_summary_json}}.',
};

export async function executeAIPipeline<T>(
  ctx: PromptAssemblyContext,
  schema: z.ZodType<T>
): Promise<T> {
  const admin = createAdminClient();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const ai = new GoogleGenAI({ apiKey });

  // 1. Fetch active prompt versions for the 4 layers
  const pipelineKey = `${ctx.pipeline}_` as string;
  const { data: prompts } = await admin
    .from('prompt_versions')
    .select('id, prompt_key, layer, template_text, locked_output_schema_json')
    .eq('active', true);

  const promptMap = new Map((prompts || []).map((p) => [p.prompt_key, p]));

  const coreIdentity =
    promptMap.get('CORE_SYSTEM_IDENTITY')?.template_text ||
    'You are Bunon, a calm, practical goal completion and comeback companion.';
  const coreLang =
    promptMap.get('CORE_LANGUAGE_RULES')?.template_text ||
    'Target language: {{language}}. Output user-facing text in this language. Keep JSON keys in English.';

  const skillKey = ctx.category ? `SKILL_${ctx.category}` : 'SKILL_OTHER';
  const skillText =
    promptMap.get(skillKey)?.template_text ||
    promptMap.get('SKILL_OTHER')?.template_text ||
    '';

  const isBd = (ctx.country || 'BD').toUpperCase() === 'BD';
  const { data: regionalRows } = await admin
    .from('regional_knowledge')
    .select('content_text')
    .eq('country', isBd ? 'BD' : 'GLOBAL')
    .eq('active', true);

  const regionalText =
    regionalRows?.[0]?.content_text ||
    (isBd ? DEFAULT_REGIONAL_BD_CONTEXT : DEFAULT_REGIONAL_GLOBAL_CONTEXT);

  const pipelinePromptRow = (prompts || []).find((p) =>
    p.prompt_key.startsWith(pipelineKey)
  );
  const pipelineText = pipelinePromptRow?.template_text || DEFAULT_PIPELINE_PROMPTS[ctx.pipeline] || '';
  const promptVersionId = pipelinePromptRow?.id;

  const allVars = {
    ...ctx.variables,
    language: ctx.language,
    user_country: ctx.country || 'BD',
  };

  const systemInstruction = [
    renderVariables(coreIdentity, allVars),
    renderVariables(coreLang, allVars),
    renderVariables(skillText, allVars),
    renderVariables(regionalText, allVars),
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');

  const userContent = renderVariables(pipelineText, allVars);
  const rawModel = ctx.model || 'gemini-3.5-flash-lite';
  const model =
    rawModel.includes('2.5') || rawModel.includes('2.0') || rawModel.includes('1.5')
      ? 'gemini-3.5-flash-lite'
      : rawModel;

  const rawSchema = ctx.responseSchema || pipelinePromptRow?.locked_output_schema_json || undefined;
  const hasValidSchema =
    rawSchema &&
    typeof rawSchema === 'object' &&
    Object.keys(rawSchema).length > 0 &&
    (rawSchema as Record<string, unknown>).type;

  const startTime = Date.now();
  let tokensIn = 0;
  let tokensOut = 0;
  let rawResponseText = '';
  let validatedOutput: T | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const contents =
        attempt === 1
          ? userContent
          : `${userContent}\n\nCRITICAL FIX: The previous attempt failed validation: ${lastError?.message}. Return valid JSON strictly matching the required schema.`;

      const genConfig: Record<string, unknown> = {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      };
      if (hasValidSchema) {
        genConfig.responseJsonSchema = rawSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: genConfig,
      });

      rawResponseText = response.text || '';
      tokensIn += response.usageMetadata?.promptTokenCount || 0;
      tokensOut += response.usageMetadata?.candidatesTokenCount || 0;

      const parsed = JSON.parse(rawResponseText);
      validatedOutput = schema.parse(parsed);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      let zodIssues: Array<{ path: string; message: string }> | undefined;
      if (err instanceof z.ZodError) {
        zodIssues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      }
      console.error('[Bunon AI]', {
        pipeline: ctx.pipeline,
        model,
        status: attempt === 1 ? 'ATTEMPT_1_FAILED' : 'SCHEMA_FAILED',
        error: lastError.message,
        ...(zodIssues ? { zodIssues } : {}),
      });

      if (attempt === 2) {
        const latencyMs = Date.now() - startTime;
        const costUsd = calculateCostUsd(tokensIn, tokensOut, model);
        await admin.from('ai_calls').insert({
          user_id: ctx.userId ?? null,
          goal_id: ctx.goalId ?? null,
          pipeline: ctx.pipeline,
          prompt_version_id: promptVersionId || '00000000-0000-0000-0000-000000000000',
          model_name: model,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          cost_usd: costUsd,
          latency_ms: latencyMs,
          status: 'SCHEMA_FAILED',
          error_code: lastError.message.slice(0, 80),
        });
        throw lastError;
      }
    }
  }

  const latencyMs = Date.now() - startTime;
  const costUsd = calculateCostUsd(tokensIn, tokensOut, model);
  await admin.from('ai_calls').insert({
    user_id: ctx.userId ?? null,
    goal_id: ctx.goalId ?? null,
    pipeline: ctx.pipeline,
    prompt_version_id: promptVersionId || '00000000-0000-0000-0000-000000000000',
    model_name: model,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd,
    latency_ms: latencyMs,
    status: 'SUCCESS',
  });

  return validatedOutput as T;
}

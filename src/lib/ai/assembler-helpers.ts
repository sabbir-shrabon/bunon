import 'server-only';
/**
 * 1. Purpose: Shared Gemini SDK timeout wrapper, fallback model helpers, and default prompt templates.
 * 2. Spec Ref: Prompt Catalog v2.5 Sections 1–7 & Vercel 60s timeout budget guard.
 * 3. Called By: src/lib/ai/assembler.ts.
 * 4. Calls: @google/genai GenerateContentParameters.
 */

import type { GenerateContentConfig, GoogleGenAI, Part } from '@google/genai';
import type { AIPipelineKey } from '@/types/domain';

export const GEMINI_ATTEMPT_TIMEOUT_MS = 12_000;

export const DEFAULT_PIPELINE_PROMPTS: Record<AIPipelineKey, string> = {
  PIPELINE_1: 'Analyze goal {{goal_title}} in category {{detected_category}}. Ask up to 3 follow-up questions.',
  PIPELINE_1B: 'Extract goal brief and memory facts from notes or file: {{pasted_or_extracted_text}}.',
  PIPELINE_2: 'Generate 4-8 milestones for {{goal_title}} (baseline: {{current_baseline}}).',
  PIPELINE_3: 'Generate week {{week_number}} tasks for {{goal_title}} under active milestone {{active_milestone_json}}.',
  PIPELINE_4: 'Adapt tasks for {{goal_title}} given trigger {{trigger_type}} and stuck reason {{stuck_reason}}.',
  PIPELINE_5:
    'Summarize completed week {{week_number}} for {{goal_title}} (baseline: {{current_baseline}}). Output ai_summary under 150 words, 3 three_bullet_lines, then_vs_now_line, partner_share_line (Clean & Minimal), photocard_witty_line (Playful / Witty), on_track, and milestone_competency_updates.',
  PIPELINE_6:
    'Re-plan remaining unfinished milestones for {{goal_title}}. Reason: {{replan_reason}}. Completed milestones: {{completed_milestones_json}}. Unfinished: {{unfinished_milestones_json}}.',
  PIPELINE_7:
    'Generate Journey Card copy and 3 Next Chapter goal suggestions for finished goal {{goal_title}}. Why: {{goal_why}}, Day-1 baseline: {{current_baseline}}, proofs: {{top_proofs_summary_json}}.',
};

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

export function calculateCostUsd(tokensIn: number, tokensOut: number, model: string): number {
  const isLite = model.includes('lite');
  return (tokensIn * (isLite ? 0.075 : 0.15) + tokensOut * (isLite ? 0.3 : 0.6)) / 1e6;
}

export function getAlternateModel(model: string): string {
  return model.includes('lite') ? 'gemini-3.8-flash' : 'gemini-3.5-flash-lite';
}

export function isTransientAIError(err: unknown): boolean {
  if (!err) return false;
  const status =
    typeof err === 'object' && err !== null
      ? (err as Record<string, unknown>).status
      : undefined;
  if (status === 503 || status === 429 || status === '503' || status === '429') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('overloaded') ||
    msg.includes('AI_REQUEST_TIMEOUT') ||
    msg.toLowerCase().includes('abort')
  );
}

export function buildGenerateConfig(
  model: string,
  systemInstruction: string,
  responseSchema?: Record<string, unknown>
): GenerateContentConfig {
  const isFlashLite = model.toLowerCase().includes('flash-lite');
  const hasValidSchema = Boolean(
    responseSchema && typeof responseSchema === 'object' && responseSchema.type
  );

  return {
    systemInstruction,
    responseMimeType: 'application/json',
    temperature: 0.2,
    ...(!isFlashLite ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    ...(hasValidSchema ? { responseJsonSchema: responseSchema } : {}),
  };
}

export function isInvalidArgumentError(err: unknown): boolean {
  if (!err) return false;
  const status =
    typeof err === 'object' && err !== null
      ? (err as Record<string, unknown>).status
      : undefined;
  if (status === 400 || status === '400') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('INVALID_ARGUMENT') || msg.includes('"code":400');
}

export async function generateWithTimeout(
  ai: GoogleGenAI,
  model: string,
  contents: string | Array<Part | { text: string }>,
  baseConfig: GenerateContentConfig,
  timeoutMs = GEMINI_ATTEMPT_TIMEOUT_MS
) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config: {
          ...baseConfig,
          abortSignal: controller.signal,
        },
      }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error(`AI_REQUEST_TIMEOUT after ${timeoutMs}ms on ${model}`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

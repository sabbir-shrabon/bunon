import 'server-only';
/**
 * 1. Purpose: Shared Gemini SDK timeout wrapper, model normalization, system prompt builder, and defaults.
 * 2. Spec Ref: Prompt Catalog v2.5 Sections 1–7 & Vercel 60s timeout budget guard.
 * 3. Called By: src/lib/ai/assembler.ts.
 * 4. Calls: @google/genai GenerateContentParameters and regional-constants.
 */

import type { GenerateContentConfig, GoogleGenAI, Part } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { AIPipelineKey } from '@/types/domain';
import {
  DEFAULT_REGIONAL_BD_CONTEXT,
  DEFAULT_REGIONAL_GLOBAL_CONTEXT,
} from './regional-constants';

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

const INSTRUCTION_PRIORITY_HEADER = [
  '### INSTRUCTION PRIORITY',
  'If instructions ever conflict, follow this strict order:',
  '1. Safety & Distress Rules',
  "2. User's Locked Memory & User's Exact Outline (FOLLOW_OUTLINE)",
  '3. Algorithmic Win Strategy Directive',
  '4. Pipeline Task Rules & Locked Output Schema',
  '5. Domain Skill & Regional Context',
].join('\n');

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

export async function resolveRegionalContext(
  admin: SupabaseClient<Database>,
  promptTemplate: string | undefined,
  regionTag: 'BD' | 'GLOBAL'
): Promise<string> {
  if (promptTemplate && promptTemplate.trim().length > 0) return promptTemplate;

  const { data: regionalRows } = await admin
    .from('regional_knowledge')
    .select('content_text')
    .eq('country', regionTag)
    .eq('active', true);

  const dbRegional = regionalRows?.[0]?.content_text;
  if (dbRegional && dbRegional.trim().length > 0) return dbRegional;

  return regionTag === 'BD' ? DEFAULT_REGIONAL_BD_CONTEXT : DEFAULT_REGIONAL_GLOBAL_CONTEXT;
}

export interface SystemInstructionLayers {
  coreIdentity: string;
  coreLang: string;
  skillText: string;
  regionalText: string;
  language: 'EN' | 'BN';
  categoryOrOther: string;
  regionTag: 'BD' | 'GLOBAL';
  variables: Record<string, unknown>;
}

export function assembleSystemInstruction(layers: SystemInstructionLayers): string {
  const renderedIdentity = renderVariables(layers.coreIdentity, layers.variables);
  const renderedLang = renderVariables(layers.coreLang, layers.variables);
  const renderedSkill = renderVariables(layers.skillText, layers.variables);
  const renderedRegional = renderVariables(layers.regionalText, layers.variables);

  const sections: string[] = [INSTRUCTION_PRIORITY_HEADER];
  if (renderedIdentity.trim()) sections.push(`### LAYER 1A: SYSTEM IDENTITY\n${renderedIdentity}`);
  if (renderedLang.trim()) {
    sections.push(`### LAYER 1B: LANGUAGE RULES (${layers.language})\n${renderedLang}`);
  }
  if (renderedSkill.trim()) {
    sections.push(`### LAYER 2: DOMAIN SKILL (${layers.categoryOrOther})\n${renderedSkill}`);
  }
  if (renderedRegional.trim()) {
    sections.push(`### LAYER 3: REGIONAL CONTEXT (${layers.regionTag})\n${renderedRegional}`);
  }
  return sections.join('\n\n');
}

export function normalizeGeminiModel(model?: string | null): string {
  if (!model) return 'gemini-3.5-flash-lite';
  const trimmed = model.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.includes('flash-lite') ||
    lower.includes('flash-8b') ||
    lower.includes('lite') ||
    lower.includes('8b')
  ) {
    return 'gemini-3.5-flash-lite';
  }
  if (lower.includes('2.5') || lower.includes('2.0') || lower.includes('1.5')) {
    return 'gemini-3.8-flash';
  }
  if (lower === 'gemini-3.5-flash-lite') return 'gemini-3.5-flash-lite';
  if (lower === 'gemini-3.8-flash') return 'gemini-3.8-flash';
  return trimmed;
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
    typeof err === 'object' && err !== null ? (err as Record<string, unknown>).status : undefined;
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
    typeof err === 'object' && err !== null ? (err as Record<string, unknown>).status : undefined;
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
        config: { ...baseConfig, abortSignal: controller.signal },
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

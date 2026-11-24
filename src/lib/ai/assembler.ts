import 'server-only';
/**
 * 1. Purpose: Assembles 4 prompt layers, calls Google Gemini with 12s timeout + zero thinking, validates JSON, and logs telemetry.
 * 2. Spec Ref: Prompt Catalog v2.5 Sections 1–7 & Database Schema Section 2.
 * 3. Called By: Pipeline runners in Next.js API routes and server services.
 * 4. Calls: @google/genai, Admin Supabase client, Zod schemas, and assembler-helpers.
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/admin';
import type { AIPipelineKey } from '@/types/domain';
import {
  DEFAULT_REGIONAL_BD_CONTEXT,
  DEFAULT_REGIONAL_GLOBAL_CONTEXT,
} from './regional-constants';
import {
  DEFAULT_PIPELINE_PROMPTS,
  buildGenerateConfig,
  calculateCostUsd,
  generateWithTimeout,
  getAlternateModel,
  isInvalidArgumentError,
  isTransientAIError,
  renderVariables,
} from './assembler-helpers';

export { renderVariables };

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
  inlineParts?: Array<{
    mimeType: string;
    data: string;
  }>;
}

export async function executeAIPipeline<T>(
  ctx: PromptAssemblyContext,
  schema: z.ZodType<T>
): Promise<T> {
  const admin = createAdminClient();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const ai = new GoogleGenAI({ apiKey });
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
  const pipelineText =
    pipelinePromptRow?.template_text || DEFAULT_PIPELINE_PROMPTS[ctx.pipeline] || '';
  const promptVersionId = pipelinePromptRow?.id;

  const allVars = {
    ...ctx.variables,
    language: ctx.language,
    user_country: ctx.country || 'BD',
  };

  const systemInstruction = [coreIdentity, coreLang, skillText, regionalText]
    .map((t) => renderVariables(t, allVars))
    .filter(Boolean)
    .join('\n\n---\n\n');

  const userContent = renderVariables(pipelineText, allVars);
  const rawModel = ctx.model || 'gemini-3.5-flash-lite';
  let activeModel =
    rawModel.includes('2.5') || rawModel.includes('2.0') || rawModel.includes('1.5')
      ? 'gemini-3.5-flash-lite'
      : rawModel;

  const rawSchema = ctx.responseSchema || pipelinePromptRow?.locked_output_schema_json || undefined;
  const schemaObj =
    rawSchema && typeof rawSchema === 'object' && (rawSchema as Record<string, unknown>).type
      ? (rawSchema as Record<string, unknown>)
      : undefined;

  const startTime = Date.now();
  let tokensIn = 0;
  let tokensOut = 0;
  let validatedOutput: T | null = null;
  let lastError: Error | null = null;

  const logAiCall = async (
    status: 'SUCCESS' | 'SCHEMA_FAILED' | 'API_ERROR',
    errorCode?: string
  ) => {
    await admin.from('ai_calls').insert({
      user_id: ctx.userId ?? null,
      goal_id: ctx.goalId ?? null,
      pipeline: ctx.pipeline,
      prompt_version_id: promptVersionId || '00000000-0000-0000-0000-000000000000',
      model_name: activeModel,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: calculateCostUsd(tokensIn, tokensOut, activeModel),
      latency_ms: Date.now() - startTime,
      status,
      ...(errorCode ? { error_code: errorCode.slice(0, 80) } : {}),
    });
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const textPrompt =
        attempt === 1
          ? userContent
          : `${userContent}\n\nCRITICAL FIX: The previous attempt failed validation: ${lastError?.message}. Return valid JSON strictly matching the required schema.`;

      const contents =
        ctx.inlineParts && ctx.inlineParts.length > 0
          ? [
              { text: textPrompt },
              ...ctx.inlineParts.map((p) => ({
                inlineData: { mimeType: p.mimeType, data: p.data },
              })),
            ]
          : textPrompt;

      let response;
      try {
        const genConfig = buildGenerateConfig(activeModel, systemInstruction, schemaObj);
        response = await generateWithTimeout(ai, activeModel, contents, genConfig);
      } catch (genErr) {
        if (isInvalidArgumentError(genErr)) {
          console.warn(
            `[Bunon AI] ${activeModel} rejected config/schema (400 INVALID_ARGUMENT); retrying plain JSON mode`
          );
          const plainConfig = buildGenerateConfig(activeModel, systemInstruction, undefined);
          delete plainConfig.thinkingConfig;
          response = await generateWithTimeout(ai, activeModel, contents, plainConfig);
        } else if (isTransientAIError(genErr)) {
          const fallback = getAlternateModel(activeModel);
          const isTimeout =
            genErr instanceof Error && genErr.message.includes('AI_REQUEST_TIMEOUT');
          console.warn(
            `[Bunon AI] ${activeModel} ${isTimeout ? 'timed out after 12s' : 'hit 503/429'}; switching to ${fallback}`
          );
          if (!isTimeout) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          activeModel = fallback;
          const fallbackConfig = buildGenerateConfig(activeModel, systemInstruction, schemaObj);
          response = await generateWithTimeout(ai, activeModel, contents, fallbackConfig);
        } else {
          throw genErr;
        }
      }

      const rawResponseText = response.text || '';
      tokensIn += response.usageMetadata?.promptTokenCount || 0;
      tokensOut += response.usageMetadata?.candidatesTokenCount || 0;

      const parsed = JSON.parse(rawResponseText);
      validatedOutput = schema.parse(parsed);
      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (isTransientAIError(err)) {
        console.error('[Bunon AI]', {
          pipeline: ctx.pipeline,
          model: activeModel,
          status: 'API_ERROR',
          error: lastError.message,
        });
        await logAiCall('API_ERROR', lastError.message);
        throw lastError;
      }

      let zodIssues: Array<{ path: string; message: string }> | undefined;
      if (err instanceof z.ZodError) {
        zodIssues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
      }
      console.error('[Bunon AI]', {
        pipeline: ctx.pipeline,
        model: activeModel,
        status: attempt === 1 ? 'ATTEMPT_1_FAILED' : 'SCHEMA_FAILED',
        error: lastError.message,
        ...(zodIssues ? { zodIssues } : {}),
      });

      if (attempt === 2) {
        await logAiCall('SCHEMA_FAILED', lastError.message);
        throw lastError;
      }
    }
  }

  await logAiCall('SUCCESS');
  return validatedOutput as T;
}

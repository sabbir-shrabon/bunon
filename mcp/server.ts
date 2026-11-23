/**
 * 1. Purpose: Bunon MCP Server exposing 4 pure domain services via stdio transport.
 * 2. Spec Ref: Milestone 5.5 Competition Pass & International AI Builders Congress 2026.
 * 3. Called By: Claude Desktop, Cursor, Antigravity, and mcp/smoke-test.ts.
 * 4. Calls: Pure domain services in src/lib/services/, @modelcontextprotocol/sdk.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getTodayPlan } from '@/lib/services/today-plan.service';
import { tickSubstep } from '@/lib/services/substep.service';
import { logDayNote } from '@/lib/services/day-note.service';
import { getWhatBunonKnows } from '@/lib/services/memory.service';

const server = new McpServer({
  name: 'bunon-mcp-server',
  version: '2.5.0',
});

function resolveUserId(providedId?: string): string {
  const uid = providedId || process.env.BUNON_USER_ID;
  if (!uid) {
    throw new Error(
      'User ID is required. Pass "userId" in tool arguments or configure "BUNON_USER_ID" in your environment.'
    );
  }
  return uid;
}

// Tool 1: get_today_plan
server.tool(
  'get_today_plan',
  'Retrieve today active plan, 3-slot fluid morph Today deck, hero task, persona profile, streak, and context banner for a Bunon user.',
  {
    userId: z
      .string()
      .uuid()
      .optional()
      .describe('User UUID (optional if BUNON_USER_ID is set in env)'),
    goalId: z
      .string()
      .uuid()
      .optional()
      .describe('Optional Goal UUID. If omitted, uses current active goal.'),
  },
  async (args) => {
    try {
      const uid = resolveUserId(args.userId);
      const plan = await getTodayPlan(uid, args.goalId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(plan, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      };
    }
  }
);

// Tool 2: tick_substep
server.tool(
  'tick_substep',
  'Tick or untick an inline sub-step (1 to N-1) for a task. Note: Final step N requires proof creation via app UI.',
  {
    userId: z
      .string()
      .uuid()
      .optional()
      .describe('User UUID (optional if BUNON_USER_ID is set in env)'),
    taskId: z.string().uuid().describe('Mother task UUID containing the sub-step'),
    stepNumber: z
      .number()
      .int()
      .min(1)
      .describe('1-based index of the sub-step to tick'),
    done: z
      .boolean()
      .default(true)
      .describe('Mark step as done (true) or undo (false)'),
  },
  async (args) => {
    try {
      const uid = resolveUserId(args.userId);
      const result = await tickSubstep(uid, args.taskId, args.stepNumber, args.done);
      return {
        isError: !result.success,
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      };
    }
  }
);

// Tool 3: log_day_note
server.tool(
  'log_day_note',
  'Log a $0-token Day Note with 0ms deterministic safety regex check. Upserts note into database.',
  {
    userId: z
      .string()
      .uuid()
      .optional()
      .describe('User UUID (optional if BUNON_USER_ID is set in env)'),
    goalId: z.string().uuid().describe('Goal UUID this day note belongs to'),
    text: z
      .string()
      .min(1)
      .max(500)
      .describe('User daily note reflection / life context text (max 500 chars)'),
  },
  async (args) => {
    try {
      const uid = resolveUserId(args.userId);
      const result = await logDayNote(uid, args.goalId, args.text);
      return {
        isError: !result.success,
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      };
    }
  }
);

// Tool 4: get_what_bunon_knows
server.tool(
  'get_what_bunon_knows',
  'Retrieve What Bunon Knows memory store (Person memory, weekly day-time map, and goal-specific journey facts).',
  {
    userId: z
      .string()
      .uuid()
      .optional()
      .describe('User UUID (optional if BUNON_USER_ID is set in env)'),
    goalId: z
      .string()
      .uuid()
      .optional()
      .describe('Optional Goal UUID for journey-specific context'),
  },
  async (args) => {
    try {
      const uid = resolveUserId(args.userId);
      const memory = await getWhatBunonKnows(uid, args.goalId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(memory, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
      };
    }
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  process.stderr.write(`Fatal MCP server error: ${error}\n`);
  process.exit(1);
});

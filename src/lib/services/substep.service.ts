import 'server-only';
/**
 * 1. Purpose: Pure domain service export for task substeps, daily quota, and task skipping.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 6 & Milestone 4 Task Loop.
 * 3. Called By: Task API routes, bunon-mcp-server (tick_substep).
 * 4. Calls: src/lib/services/task-service.ts.
 */

export {
  tickSubstep,
  logDailyQuota,
  skipTaskAsBasic,
  undoTaskAdjustment,
} from './task-service';

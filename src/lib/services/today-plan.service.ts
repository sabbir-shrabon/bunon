import 'server-only';
/**
 * 1. Purpose: Pure domain service export for assembling Today plan, persona, and banner state.
 * 2. Spec Ref: Database Schema v2.5 Section 5, Prompt Catalog Rule 6, & Category C Screens 22-37b.
 * 3. Called By: /api/today route handler, bunon-mcp-server (get_today_plan).
 * 4. Calls: src/lib/services/today-service.ts.
 */

export {
  getTodayPlan,
  type TodayPlanResponse,
  type ContextBannerData,
  type ContextBannerType,
} from './today-service';

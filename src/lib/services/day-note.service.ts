import 'server-only';
/**
 * 1. Purpose: Pure domain service export for $0 zero-token Day Note logging and crisis safety checking.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 8 & Stitch Screen 34/Screen 16.
 * 3. Called By: Day note API route, bunon-mcp-server (log_day_note).
 * 4. Calls: src/lib/services/day-note-service.ts.
 */

export {
  logDayNote,
  getTodayDayNote,
  type LogDayNoteResult,
} from './day-note-service';

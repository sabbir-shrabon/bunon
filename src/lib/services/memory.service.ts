import 'server-only';
/**
 * 1. Purpose: Pure domain service export for reading and mutating What Bunon Knows memory.
 * 2. Spec Ref: Database Schema v2.5 Section 5.2 Table 1 & Competition Addendum Rule 9.
 * 3. Called By: /api/what-bunon-knows route, bunon-mcp-server (get_what_bunon_knows).
 * 4. Calls: src/lib/services/context-service.ts.
 */

export {
  getWhatBunonKnows,
  addMemoryItem,
  updateMemoryItem,
  deleteMemoryItem,
  type WhatBunonKnowsResponse,
} from './context-service';

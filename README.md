# Bunon (বুনন) — AI-Powered Goal Completion & Comeback Companion
> **International AI Builders Congress 2026** • Milestone 5.5 Competition Pass

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.6-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-4.3.3-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ecf8e.svg)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20%2B%20Lite-orange.svg)](https://deepmind.google/technologies/gemini/)
[![MCP Server](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-8a2be2.svg)](https://modelcontextprotocol.io/)

---

## 🎯 1. Problem & Solution

### The Problem: The Day-14 Goal Drop-Off Trap
Almost every goal-tracking and productivity app is built for day one — when motivation is high and energy is limitless. Users create optimistic roadmaps and lofty daily task lists. But within two weeks, real life hits: university semester finals, tuition crunches, sudden illness, or work deadlines.
- Traditional apps punish users with red badges, guilt-inducing notifications, and accumulated backlog debt.
- Facing 40 overdue tasks, users feel overwhelming shame and abandon the app entirely.

### The Solution: Bunon (বুনন — "Weaving" in Bengali)
Bunon is an adaptive 4-week to 12-month goal completion and comeback companion engineered from first principles around human psychology and momentum preservation:
1. **Comeback-First Psychology:** Slipped for 3 days or 2 weeks? Bunon greets you with zero guilt, celebrates your return, and recalculates the next realistic step.
2. **Deterministic Path-vs-Dose Adaptation Levers:**
   - **`SLICE`** (Deliverable): Keep the mother task in the week; slice today's focus to just the next 15-minute sub-step.
   - **`SWAP`** (Daily Core Habit): Never cut the daily dose (7/7 biological rhythm); swap the method to a zero-prep alternative.
   - **`MOVE`** (Weekly Quota): Shift missed sessions (e.g. 3x/wk gym) to the next open day in your availability map.
   - **`REWRITE`** (Unclear Task): If a task is confusing or not useful, Bunon takes ownership and generates a clearer version.
3. **Completion-Gated Weeks:** Weeks never automatically close or push debt into the next week. You finish your deliverables or explicitly skip them before unlocking Week 2.
4. **Frictionless Momentum:** Sub-steps 1 through N-1 tick with 0 proof to maintain flow; the final Step N requires real photo or video proof to seal the mother task.
5. **Calm Aesthetic (99% Neutral + 1% Marigold):** Clean canvas (`#F6F7F8`), crisp border hairlines (`#E3E5E8`), carbon black primary actions (`#1A1A1B`), with Marigold (`#FFB020`) strictly reserved for completed finish marks.

---

## 🏗️ 2. Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │    Next.js 16 App Router (proxy.ts)          │
                      │  • Host Isolation: admin.bunon.app vs Public │
                      │  • Frictionless Direct Guest Entry           │
                      │  • Just-in-Time Auth Redirects               │
                      └──────────────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────┴───────────────────────┐
                      │        Presentation & Experience Tier        │
                      │  • 3-Slot Fluid Morph Today Deck             │
                      │  • 2-Beat Thread (Do Beat 1 -> Prove Beat 2) │
                      │  • 5-Zone Canvas Photocard Generator (1080p) │
                      │  • Global Currency Toggle (BDT ৳ / USD $)    │
                      └──────────────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────┴───────────────────────┐
                      │             Pure Domain Services             │
                      │        (src/lib/services/ — $0 Tokens)       │
                      │  • getTodayPlan()     • tickSubstep()        │
                      │  • logDayNote()       • getWhatBunonKnows()  │
                      └──────────────┬───────────────────────┬───────┘
                                     │                       │
          ┌──────────────────────────┴────────┐   ┌──────────┴────────────────────────┐
          │     bunon-mcp-server (mcp/)       │   │      4-Gate AI Token Firewall     │
          │  • Stdio Transport for Claude,    │   │  Gate 1: Schema & Length Check    │
          │    Cursor, and Antigravity        │   │  Gate 2: User Cooldown & Rate-Lim │
          │  • Exposes 4 Pure Domain Services │   │  Gate 3: Cost Budget & Downgrade  │
          │  • Standalone react-server runtime│   │  Gate 4: Output Sanitize & Zod    │
          └───────────────────────────────────┘   └───────────────────┬───────────────┘
                                                                      │
                                                  ┌───────────────────┴───────────────┐
                                                  │   4-Layer Dynamic Prompt Assembly │
                                                  │  Layer 1: Core System & Language  │
                                                  │  Layer 2: Domain Skill (Fitness/..)│
                                                  │  Layer 3: Regional (BD vs Global) │
                                                  │  Layer 4: Pipelines 1–7 (Gemini)  │
                                                  └───────────────────┬───────────────┘
                                                                      │
                      ┌───────────────────────────────────────────────┴───────────────┐
                      │              Supabase PostgreSQL & Private Storage            │
                      │  • 25-Table RLS Schema (Users, Goals, Milestones, Tasks...)   │
                      │  • Private 'bunon-proofs' Storage Bucket with Signed URLs     │
                      │  • 15 Database-Managed Prompts in 'prompt_versions'           │
                      │  • Deterministic 0ms Day Note Crisis Safety Regex             │
                      └───────────────────────────────────────────────────────────────┘
```

---

## ⚡ 3. Quick Local Setup & MCP Testing

### Prerequisites
- Node.js >= 20 (Node 24 recommended)
- Supabase project or local Supabase CLI

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Configuration
Create `.env.local` in the project root:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key

# Optional: Demo user UUID for bunon-mcp-server
BUNON_USER_ID=d2394218-0785-484d-8f2d-1b392daddf21
```

### Step 3: Run Database Migration & Seed
Apply schema and seed data in your Supabase SQL Editor:
1. `supabase/migrations/0001_bunon_v25_schema.sql` (all 22 core tables, RLS policies, triggers)
2. `supabase/seed.sql` (15 prompts, 5 goal categories, BD & Global regional contexts, BDT/USD pricing plans)

### Step 4: Run MCP Server Smoke Test
Verify all 4 core domain tools and test live execution against Supabase:
```bash
npm run mcp:test
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⏱️ 4. 3-Minute Live Demo Script for Judges

| Elapsed | Action / Screen | What to Look For |
| :--- | :--- | :--- |
| **0:00 - 0:30** | **Direct Guest Entry**<br>`http://localhost:3000` | • Clean `today_guest_entry/` empty state renders instantly.<br>• **Zero auth wall or blocking modals** for curious visitors.<br>• Tap *"Start your first goal"* -> smoothly enters Just-in-Time auth. |
| **0:30 - 1:15** | **Fast Onboarding & Plan A/B**<br>`/onboarding` (Screens 10–20) | • Q1 Goal & Why -> Q2 Deadline -> Q3 Working Days -> Q4 Baseline.<br>• AI generates **Plan A (Recommended)** vs **Plan B (Aggressive)**.<br>• Screen 20 previews a full sample week with time-budgeted sub-steps. |
| **1:15 - 2:00** | **Today 3-Slot Morph & Proof**<br>`/today` (Screen 22) | • **Task-First 2-Beat Thread:** Beat 1 (Do) & Beat 2 (Prove).<br>• Expand accordion: Ticking steps 1..N-1 requires **0 proof** (fast flow).<br>• Step N requires photo/video evidence to mark task DONE.<br>• Log a Day Note: saves at **$0 token cost** with **0ms crisis regex check**. |
| **2:00 - 2:30** | **Roadmap, Timeline & Global Pro**<br>`/roadmap`, `/timeline`, `/pro` | • Screen 50: Interactive knot roadmap with completion-gated weeks.<br>• Screen 61: Personal goal milestone feed.<br>• `/pro` (Screen 104): **BDT / USD currency toggle pill** (`৳149` vs `$1.99`), auto-hiding prices when `X-Bunon-Platform: play-store` is present. |
| **2:30 - 3:00** | **Live MCP External Agent Call**<br>`npm run mcp:test` | • Run `npm run mcp:test` in your terminal.<br>• Connects via stdio client, discovers all 4 tools, and invokes `get_what_bunon_knows` & `get_today_plan` against live Supabase data in <500ms.<br>• Ready for Claude Desktop, Cursor, and Antigravity. |

---

## 📋 5. Verification Commands

```bash
# 1. Typecheck (0 TypeScript errors)
npm run typecheck

# 2. Production Build Check
npm run build

# 3. Model Context Protocol Test
npm run mcp:test
```

---

*Built with care for the International AI Builders Congress 2026.*

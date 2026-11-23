# Bunon v2.5 — Coding Agent Rules, Architecture & Stitch UI Contract

> **Source of Truth:** The Bunon v2.5 product specifications in `docs/specs/` and Stitch mobile design system in `docs/specs/ui-references/stitch_bunon_mobile_design_system/`. Never invent features, database columns, UI styles, or AI prompts outside these documents.

---

## 1. Golden Rules for the Coding Agent

### Rule 1: Never Build Everything at Once (Milestone Lock)
- Work strictly on the current milestone requested by the user.
- Do NOT generate placeholder pages or speculative stubs for future milestones.
- At the end of each milestone, run `npm run typecheck` and `npm run build` and fix every TypeScript error before stopping.

### Rule 2: Zero `// TODO` or Fake Mock Data
- Strictly forbid `// TODO`, `// implement later`, and hardcoded fake mock arrays in production routes.
- Every API route, service function, and server action must read and write real rows in Supabase PostgreSQL.

### Rule 3: Mandatory Top-of-File Header Comment
Every `.ts` and `.tsx` file MUST start with a strict 4-line header comment:
```typescript
/**
 * 1. Purpose: [Plain English explanation of what this file does]
 * 2. Spec Ref: [Exact spec document, screen number, table, or prompt pipeline]
 * 3. Called By: [Parent component, route handler, or calling service]
 * 4. Calls: [Child components, database queries, AI firewall, or utility functions]
 */
```

### Rule 4: 250-Line Maximum File Size (Modular Split)
- Never write monolithic or spaghetti files. Keep every component and service file under 250 lines.
- Split UI into clean sub-components (`TaskCard.tsx`, `SubStepList.tsx`, `UndoChip.tsx`, etc.).
- Keep all database queries, AI logic, and business domain actions inside `src/lib/`.

### Rule 5: Server-Only Secrets & 4-Gate AI Firewall
- Import `'server-only'` at the top of all files in `src/lib/ai/*`, `src/lib/services/*`, and `src/lib/db/admin.ts`.
- The browser client can NEVER call the Gemini API directly or query system tables (`prompt_versions`, `ai_calls`, `system_settings`).
- Every AI call must pass through `src/lib/ai/firewall.ts` (Gate 1: Schema & Length Validation, Gate 2: Rate Limit / Cooldown, Gate 3: Cost / Token Budget & Graceful Fallback, Gate 4: Output Sanitization & Zod Parsing).

### Rule 6: Strict TypeScript & Locked JSON Schemas
- Enable `"strict": true` in `tsconfig.json`. Never use `any`.
- Define Zod schemas and TypeScript interfaces in `src/types/` matching the exact Locked Output JSON Keys defined in *Bunon — AI Prompt Architecture & Complete Prompt Catalog (v2.5)*.

### Rule 7: Enforce Bunon's 99% Neutral + 1% Marigold UI
- Follow Section 1 of the Stitch UI Design Guide: `#F6F7F8` page background, `#FFFFFF` cards, `1px solid #E3E5E8` borders, and zero drop shadows on cards (`shadow-none`).
- Strictly ONE solid carbon black (`#1A1A1B`) primary button per screen (52px height, full pill `rounded-full`, text `#FFFFFF`).
- Marigold (`#FFB020`) is used ONLY on finished marks (completed step checkmarks, reached milestone knots, Journey Card seal). Never use Marigold for buttons, interactive states, banners, or badges.

### Rule 8: Exact v2.5 Behavioral Contracts (Zero Blackbox)
- **Completion-Gated Weeks:** In `deliverable_queue`, never close a week until all deliverables for that week are `DONE` or `SKIPPED_BASIC`.
- **Sub-Steps:** Steps 1 through N-1 tick with 0 proof and update `last_activity_date`; Final Step N displays `"Add proof"` + Camera + Note and completes the mother task.
- **Day Notes:** Save at $0 tokens after a 0ms crisis regex check; never trigger an immediate LLM call.

---

## 2. Rule 9 — International AI Builders Congress 2026 Competition Addendum (Mandatory)

1. **Pure Domain Services (`src/lib/services/`):**
   - Keep core domain actions (`getTodayPlan`, `tickSubstep`, `logDayNote`, `getWhatBunonKnows`) as pure, reusable server functions in `src/lib/services/`.
   - Next.js API routes import these domain functions directly.
   - This ensures we can cleanly expose them via an MCP (Model Context Protocol) server right after Milestone 5 without refactoring core logic.
2. **Global Readiness Fallbacks:**
   - In `supabase/seed.sql` (and `regional_knowledge`), include a `REGIONAL_GLOBAL_CONTEXT` fallback alongside `REGIONAL_BD_CONTEXT`.
   - Add an optional `price_usd` column to `pricing_plans` so the application can demonstrate global multi-currency readiness alongside BDT pricing.
3. **Competition Phase Gate:**
   - Strictly STOP after Milestone 5 (Stage A Core Loop).
   - A dedicated Milestone 5.5 competition pass (judging prep, MCP server integration, demo recording) must be completed before touching Milestones 6–7.

---

## 3. Rule 10 — Strict Stitch UI Reference Lock (Zero Hallucination)

Before building ANY screen or component, inspect `docs/specs/ui-references/stitch_bunon_mobile_design_system/bunon_minimalist_thread/DESIGN.md` AND the matching screen folder's `code.html` and `screen.png`.

### Stitch Design System Specs
- **Canvas / Page Background:** `#F6F7F8`
- **Surfaces / Cards / Sheets:** `#FFFFFF`
- **Borders & Dividers:** Crisp `1px solid #E3E5E8`, zero drop shadows on cards (`shadow-none`)
- **Primary Ink / Headings:** `#1A1A1B`
- **Muted Metadata / Captions:** `#6B6F76`
- **Inactive / Thread Dots:** `#8A8D94` and `#E3E5E8`
- **Secondary Surfaces / Chips:** `#EDEEF0` fill
- **Finished Accent (1% Marigold):** `#FFB020` ONLY on completed checkmarks, finished knots, and final Journey Card seal (never green, never on buttons)
- **Geometry & Radii:**
  - Cards: `rounded-[20px]` or `rounded-[24px]`
  - Bottom Sheets: `rounded-t-[28px]`
  - Form Inputs: `rounded-xl` (12px), height 48px, border `1px solid #E3E5E8`, focus `#1A1A1B`
  - Buttons / Chips: `rounded-full` (9999px pill)
- **Typography:** Sentence case everywhere (no ALL-CAPS micro labels). `Inter` font family with `Noto Sans Bengali` fallback.
- **The Thread:** Continuous 1.5px vertical hairline (`#E3E5E8`) connecting steps, milestones, and feed nodes.

### Exact Screen-to-Stitch Folder Mapping

| Screen / Feature | Route / View | Stitch Reference Folder | Key Files |
| :--- | :--- | :--- | :--- |
| **Guest Today (Empty State)** | `/`, `/today` (no active goal) | `today_guest_entry/` | `code.html`, `screen.png` |
| **Sign In / Create Account** | `/login` | `sign_in_create_account/` | `code.html`, `screen.png` |
| **Desktop Web Shell** | `desktop_web_shell_today_workspace/` (`>= 768px`) | `desktop_web_shell_today_workspace/` | `code.html`, `screen.png` |
| **Navigation Drawer** | Screen 69 (Left Drawer) | `navigation_drawer/` | `code.html`, `screen.png` |
| **Onboarding Q1 (Goal & Why)** | `/onboarding` (Screen 10) | `onboarding_q1_goal_and_why/` | `code.html`, `screen.png` |
| **Roadmap Preview (Plan A/B)** | Screen 17 | `roadmap_preview_with_plan_a_b_toggle/` | `code.html`, `screen.png` |
| **Weekly Plan Style Preview** | Screen 20 | `choose_your_weekly_style_with_sample_week_preview/` | `code.html`, `screen.png` |
| **What Bunon Knows** | `/what-bunon-knows` (Page 50a) | `what_bunon_knows/` | `code.html`, `screen.png` |
| **Today Hero 2-Beat Thread** | `/today` (Screen 22 active) | `today_cleanest_2_beat_thread/` & `today_inline_sub_steps_expanded/` | `code.html`, `screen.png` |
| **Stuck Bottom Sheet** | Sheet 37b (`'Stuck or short on time?'`) | `stuck_bottom_sheet/` | `code.html`, `screen.png` |
| **Create Proof** | `/proof/create` (Screen 40) | `create_proof/` | `code.html`, `screen.png` |
| **Roadmap Journey Map** | `/roadmap` (Screen 50) | `roadmap_journey_map/` | `code.html`, `screen.png` |
| **Timeline Feed** | `/timeline` (Screen 61) | `timeline_personal_journey_feed/` | `code.html`, `screen.png` |
| **Journey Card** | `/journey/[slug]` (Screen 97) | `journey_card/` | `code.html`, `screen.png` |

---

## 4. Rule 11 — Frictionless Auth & Entry Contract

1. **Direct Guest Entry:**
   - Routes `/` and `/today` NEVER present an auth wall or blocking login modal to guests.
   - Unauthenticated visitors see the clean `today_guest_entry/` empty state with a `"Start your first goal"` primary button (`-> /login?next=/onboarding`) and a subtle `"Sign in"` header link (`-> /login?next=/today`).
2. **Just-in-Time Auth:**
   - Auth is required only when necessary: visiting `/onboarding`, saving onboarding goal selections, accessing `/settings`, or visiting `/pro`.
   - On successful sign in / account creation, redirect the user back to the `next` query parameter (defaulting to `/today`).
3. **Email + Password (Min 8 Characters):**
   - Implemented via `supabase.auth.signUp` (with one-time email confirmation if enabled) and `supabase.auth.signInWithPassword` (instant returning sign-in with ZERO repeated OTPs).
   - Password reset is handled via standard Supabase email-link flow.
4. **Automatic Profile Upsert:**
   - Automatically upsert a row in `public.users` on the first authenticated session (via trigger or post-auth hook) so downstream profile updates never fail with `401 Unauthorized` or missing foreign keys.
5. **Zero Forced Onboarding:**
   - Authenticated users with 0 goals who visit `/today` are NEVER forcibly redirected to `/onboarding`. They see the clean empty state with `"Start your first goal"`.

---

## 5. Exact Folder & File Architecture Map

```
bunon app/
├── docs/
│   └── specs/                                 # Specifications & Stitch UI design guide
│       └── ui-references/
│           └── stitch_bunon_mobile_design_system/ # Stitch screen designs (code.html & screen.png)
├── supabase/
│   ├── migrations/                            # 0001_bunon_v25_schema.sql (all 22 tables, RLS, triggers)
│   └── seed.sql                               # 15 prompts, 5 categories, regional BD & Global context, plans
├── src/
│   ├── types/
│   │   ├── database.ts                        # Exact TypeScript row types for all 22 tables
│   │   ├── ai-schemas.ts                      # Locked JSON output types for Pipelines 1–7
│   │   └── domain.ts                          # Enums (UserState, PlanStyle, AdaptationPolicy)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts                      # Browser Supabase client (anon key + RLS)
│   │   │   ├── server.ts                      # Next.js Server Component / Route Handler client
│   │   │   └── admin.ts                       # Service-role client (server-only, for cron & admin)
│   │   ├── ai/
│   │   │   ├── firewall.ts                    # 4-Gate AI Token Firewall & graceful model downgrade
│   │   │   ├── assembler.ts                   # Combines Layers 1–4 (Core, Skill, Regional, Pipeline)
│   │   │   ├── persona-engine.ts              # $0 14-day trend & {{win_strategy_directive}} calculator
│   │   │   ├── context-pack.ts                # Pulls top 15 items from Page 50a (About me + Goal)
│   │   │   └── step-slicer.ts                 # $0 DAILY_ADAPTIVE greedy step-slicing calculator
│   │   └── services/                          # Pure domain functions (reusable by API & MCP server)
│   │       ├── today-plan.service.ts          # getTodayPlan()
│   │       ├── substep.service.ts             # tickSubstep()
│   │       ├── day-note.service.ts            # logDayNote()
│   │       └── memory.service.ts              # getWhatBunonKnows()
│   ├── components/
│   │   ├── ui/                                # Primitives (PrimaryButton, PillChip, ThreadNode, BottomSheet)
│   │   ├── shell/                             # TopBar, GoalSwitcherBar, BottomNav3Tab, LeftDrawer69, DesktopShell22D
│   │   ├── today/                             # MotherTaskCard, InlineSubSteps, WhyThisTaskSheet22b, StuckSheet37b
│   │   └── photocard/                         # PhotocardCanvas1080x1350 (5-zone client-side Canvas/SVG renderer)
│   ├── app/
│   │   ├── (user)/                            # User-facing routes
│   │   │   ├── page.tsx                       # Root redirect / Direct Guest Entry
│   │   │   ├── today/                         # Guest empty state 22a + active Today Screen 22
│   │   │   ├── login/                         # Email + Password Sign In / Create Account with ?next=
│   │   │   ├── onboarding/                    # Screens 10–20 (Just-in-Time Auth protected)
│   │   │   ├── roadmap/                       # Screen 50 Journey Map
│   │   │   ├── what-bunon-knows/              # Dedicated Page 50a with sliding goal tabs
│   │   │   ├── timeline/                      # Screen 61 Personal Goal Timeline
│   │   │   ├── proof/create/                  # Screen 40 Proof upload & camera capture
│   │   │   ├── journey/[slug]/                # Screens 97 & 102 Journey Card & Public Share
│   │   │   └── settings/                      # Screen 88 Settings
│   │   ├── (admin)/                           # Isolated to admin.bunon.app via middleware
│   │   │   └── ...                            # Screens 123–144 (2FA, AI Ops, 15-Prompt Editor, Audit Log)
│   │   └── api/                               # Next.js API route handlers importing src/lib/services/
│   └── middleware.ts                          # Host isolation (admin.bunon.app) & header detection
├── CLAUDE.md                                  # Coding agent guidelines & architecture contract
└── .cursorrules                               # Cursor rules mirror
```

---

## 6. Milestone Execution Roadmap

| Milestone | Scope | Deliverables | Verification Gates |
| :--- | :--- | :--- | :--- |
| **Milestone 1** | Database, Types & Seed Script | • Schema with 22 tables, RLS, triggers<br>• `src/types/database.ts` & `ai-schemas.ts`<br>• `seed.sql` with 15 prompts, starter categories, BD & Global context | 1. Supabase migration runs cleanly<br>2. 22 tables & 15 prompt rows exist<br>3. `npm run typecheck` passes with 0 errors |
| **Milestone 2** | Design System, App Shell & Auth | • Tailwind tokens for 99% Neutral + 1% Marigold<br>• `middleware.ts` domain isolation<br>• Responsive App Shell (Mobile + Desktop)<br>• Direct Guest Entry + Email/Password Auth | 1. Guest visits `/` and `/today` cleanly<br>2. Sign up / login redirects via `next`<br>3. `public.users` upserted on first auth |
| **Milestone 3** | AI Engine, Onboarding & Style Preview | • 4-Gate AI Firewall (`firewall.ts`)<br>• 4-Layer prompt assembler<br>• Page 50a (`/what-bunon-knows`)<br>• Fast Onboarding Screens 10–21 | 1. Onboarding generates Plan A/B<br>2. Screen 20 preview displays sample week<br>3. AI calls tracked in `ai_calls` |
| **Milestone 4** | Today Loop, Inline Sub-Steps & Slicer | • Task-First 2-Beat Thread Screen 22<br>• Inline sub-step accordion (1..N-1 no proof, N proof)<br>• Stuck Sheet 37b & `$0` Day Note save | 1. Ticking steps 1..N-1 succeeds with 0 proof<br>2. Step N requires proof to finish mother task<br>3. Day Notes save at $0 with 0ms regex check |
| **Milestone 5** | Weeks, Roadmap, Timeline & Photocards | • Completion-gated week progression<br>• Screen 50 Roadmap Journey Map<br>• Screen 61 Personal Goal Timeline<br>• 5-Zone Photocard Canvas generator | 1. Week 1 completion unlocks Week 2<br>2. Photocard exports in both Playful & Clean vibes<br>3. Goal completion unlocks Journey Card 97 |
| **Milestone 5.5** | **Competition Pass (Congress 2026)** | • Pure services export via MCP server<br>• Multi-currency check (`price_usd`)<br>• Judging demo recording & test scenarios | 1. MCP server executes domain actions cleanly<br>2. Core loop passes end-to-end audit |
| **Milestone 6** | Pro Payments & Referrals | • `/upgrade` Pro pass selector<br>• Webhook HMAC check & payment anti-spoofing<br>• Referral QR & 3-task reward engine | 1. Sandbox payment verification succeeds<br>2. Duplicate webhook replay blocked |
| **Milestone 7** | Desktop Admin Console & Security | • Admin 2FA TOTP login & session cookie<br>• Prompt editor, AI ops & audit log<br>• 8 Pre-launch security tests | 1. 2FA login verified on `admin.bunon.app`<br>2. Live prompt editor testing passes |

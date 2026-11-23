/**
 * 1. Purpose: Default fallback text for regional knowledge (BD and International Global).
 * 2. Spec Ref: Milestone 5.5 Competition Pass, seed.sql section 4, CLAUDE.md Rule 9.
 * 3. Called By: src/lib/ai/assembler.ts.
 * 4. Calls: None (static text templates).
 */

export const DEFAULT_REGIONAL_BD_CONTEXT = `REGIONAL CONTEXT — BANGLADESH (BD):
1. Currency & Budgets: Always reference money and budgets in Bangladeshi Taka (BDT / টাকা). Respect student and early-founder budgets in Bangladesh (prefer free or low-cost tools before paid subscriptions).
2. Local Schedule & Rhythm: Standard work/academic week runs Sunday–Thursday (with Friday–Saturday off). Follow the working_days selected by the user.
3. Category-Specific Local Context:
   • BUSINESS & ENTREPRENEURSHIP: F-commerce (Facebook Page, Boost, Messenger), WhatsApp Business, Instagram, Daraz, Chaldal, Pathao/Steadfast courier delivery (Cash on Delivery), bKash and Nagad payments, trade license / TIN basics.
   • WORK & STUDY: University semester systems, local IT/software roles, remote freelancing (Upwork, Fiverr), competitive programming, BCS/bank prep, IELTS practice.
   • FITNESS: Local staples (rice, dal, fish, eggs, seasonal vegetables), warm/monsoon weather, home routines, walking when gym access is unstated.
4. Natural Relevance: Make examples and constraints feel genuinely local to Bangladesh.`;

export const DEFAULT_REGIONAL_GLOBAL_CONTEXT = `REGIONAL CONTEXT — GLOBAL / INTERNATIONAL (Fallback):
1. Currency & Budgets: Reference money and budgets in USD ($) or universal units unless user specifies otherwise. Prefer accessible open-source or free-tier platforms.
2. Schedule & Rhythm: Standard work week runs Monday–Friday (with Saturday–Sunday off) unless the user explicitly selects different working days.
3. Universal Channels & Tooling:
   • BUSINESS & ENTREPRENEURSHIP: Stripe, PayPal, Shopify, Substack, LinkedIn, GitHub, Notion, Product Hunt, X, and standard cloud tools.
   • WORK & CAREER: Remote work best practices, asynchronous documentation, GitHub PR workflows, technical portfolios, and modern certification tracks.
   • FITNESS: Whole-food nutrition, bodyweight mobility, standard gym equipment, step counting, and progressive overload principles.
4. Cultural Neutrality: Keep examples realistic, accessible across time zones, and culturally inclusive.`;

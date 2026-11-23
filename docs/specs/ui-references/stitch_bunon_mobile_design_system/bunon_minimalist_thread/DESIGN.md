---
name: Bunon Minimalist Thread
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#46474a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#76777b'
  outline-variant: '#c7c6ca'
  surface-tint: '#5f5e5f'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1c'
  on-primary-container: '#858384'
  inverse-primary: '#c8c6c7'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#dcdddf'
  on-secondary-container: '#5f6163'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#291800'
  on-tertiary-container: '#b37800'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e3'
  primary-fixed-dim: '#c8c6c7'
  on-primary-fixed: '#1b1b1c'
  on-primary-fixed-variant: '#474647'
  secondary-fixed: '#e1e2e4'
  secondary-fixed-dim: '#c5c6c8'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#ffddb1'
  tertiary-fixed-dim: '#ffba4b'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies deliberate quietude, tactile clarity, and quiet craftsmanship. Tailored specifically for modern mobile experiences (optimized for 390x844 viewports), it rejects decorative clutter, artificial gamification, saturated feedback loops, and celebratory noise. 

The aesthetic is ultra-clean architectural minimalism defined by an asymmetric 99% neutral palette and a singular 1% functional Marigold accent. Visual structure relies entirely on precision hairline boundaries, generous breathing space, and consistent structural geometry—never heavy drop shadows or layered elevations. 

### Core Principles
- **Quiet Utility:** Interfaces are functional white canvas spaces allowing progress, steps, and information to breathe without visual fatigue.
- **The Thread:** The central visual narrative is a continuous, understated hairline vertical spine connecting structural milestones and actions.
- **Singular Intent:** Every screen commands at most one dark primary action to guarantee immediate hierarchical clarity.
- **Restrained Celebration:** Progress is acknowledged through quiet, singular Marigold nodes rather than standard saturated green badges or decorative banners.
- **Zero Saturated Noise:** Excludes color emojis, mascot illustrations, uppercase micro-labels, and monospaced typography.

## Colors

The palette operates under a strict 99% neutral / 1% Marigold balance. Color is never decorative; it functions strictly as state distinction.

### Surface & Ink Hierarchy
- **Canvas / Background (`#F6F7F8`):** The muted neutral backdrop across the entire application canvas.
- **Surfaces (`#FFFFFF`):** Reserved for elevated modules: cards, modal sheets, top bars, and navigation bottom bars.
- **Borders & Dividers (`#E3E5E8`):** Crisp 1px hairline rules providing structural separation with zero drop shadow reliance.
- **Primary Ink (`#1A1A1B`):** Deep carbon black for primary headlines, critical body text, and the sole solid primary CTA.
- **Muted Text (`#6B6F76`):** Balanced neutral slate for secondary metadata, descriptions, and supporting captions.
- **Inactive Elements (`#8A8D94`):** Soft stone grey for uncompleted nodes, upcoming rings, and resting icons.
- **Secondary Surfaces (`#EDEEF0`):** Soft grey fill used exclusively for secondary pill actions and chip containers.

### The 1% Marigold Rule
- **Marigold Accent (`#FFB020`):** Strictly reserved for finished completion marks (completed task nodes, reached milestone knots, Journey Card seals).
- **Prohibitions:** Marigold must never be used for buttons, interactive states, banners, notification badges, active/in-progress indicators, or typographic emphasis. Done states use Marigold—never green.

## Typography

The typographic system utilizes **Inter** (with seamless multilingual fallback to **Noto Sans Bengali** where localized). The tone is modern, understated, and humanist.

### Style Directives
- **Sentence Case Everywhere:** Headlines, labels, buttons, and badges must always be set in sentence case. Never use all-caps or small-caps micro labels.
- **Pure Sans Hierarchy:** No monospaced fonts, display serifs, or decorative script styles.
- **Vertical Rhythm:** Line heights match standard mobile readability bounds, keeping compact vertical cards readable without visual sprawl.

## Layout & Spacing

Designed specifically around a 390x844 viewport grid with a fluid mobile container maxed at 428px. 

### Grid & Canvas Structure
- **Outer Canvas Margins:** Strict 16px (`1rem` / `mx-4`) margins ensure components do not touch screen edges.
- **Card Spacing:** Standard vertical separation between modular cards is fixed at 16px (`gap-4` / `space-md`).
- **Internal Card Padding:** All primary structural cards enforce 24px (`1.5rem` / `p-6`) internal breathing room to preserve low-density calm.
- **Top & Bottom Bar Safe Zones:** Top bars maintain a 56px baseline height plus native safe areas. Bottom navigation bars hold a 64px structural height plus bottom home indicator offset, featuring `#FFFFFF` background with a top 1px `#E3E5E8` hairline boundary.

## Elevation & Depth

This design system avoids simulated drop shadows in favor of flat structural boundaries. Depth is defined through planar contrast and crisp vector separation.

### Surface Architecture
- **Cards & Surfaces:** Pure flat `#FFFFFF` resting upon `#F6F7F8` canvas, surrounded by a 1px solid `#E3E5E8` border. Absolute zero shadow (`shadow-none`).
- **Dividers & Structural Rules:** 1px hairline rules in `#E3E5E8`. No soft gradient drop-offs.
- **Bottom Sheets:** Rounded top corners (`rounded-t-[28px]`), surface fill `#FFFFFF`, isolated from background content using a 20% opacity neutral backdrop overlay (`rgba(26, 26, 27, 0.20)`). A soft, low-intensity diffused contact shadow (`0px -8px 24px rgba(0, 0, 0, 0.04)`) may be used exclusively on transient sheets to clarify separation from the underlying view.

## Shapes

The geometric personality blends structured rectangular card modules with hyper-tactile, fully rounded interaction targets.

### Radius System
- **Cards:** Curvature is 20px (`rounded-[20px]`).
- **Bottom Sheets:** Top edge curvature is 28px (`rounded-t-[28px]`).
- **Interactive Targets (Buttons & Chips):** Full round pills (9999px / `rounded-full`).
- **Form Inputs:** 12px border-radius (`rounded-xl`).
- **Progress Knots & Nodes:** Pure geometric circles (`rounded-full`).

## Components

### 1. Buttons
- **The One-Solid-Button Rule:** Maximum of **one** solid black CTA button per screen (`bg-[#1A1A1B]`, text `#FFFFFF`, full pill `rounded-full`, height 52px).
- **Secondary Buttons:** Full pill (`rounded-full`), height 52px. Rendered either as a solid neutral fill (`bg-[#EDEEF0]`, text `#1A1A1B`) or a clean hairline outline (`border border-[#E3E5E8]`, text `#1A1A1B`, `bg-transparent`).
- **Tertiary / Inline Actions:** Plain text links using `#1A1A1B` with medium weight, or `#6B6F76` for low-priority dismissals. Never use Marigold for buttons.

### 2. The Thread & Milestone Knots
- **The Thread:** A continuous 1.5px vertical line (`#E3E5E8`) connecting chronological steps, milestones, or timeline tasks.
- **Knots (Nodes):** 16px circular indicators along the thread.
  - *Completed Knot:* Solid Marigold fill (`#FFB020`) with an internal white checkmark or mini center dot.
  - *Current / Pending Knot:* Hollow circle with 2px hairline border in `#8A8D94` and `#FFFFFF` core.
  - *Upcoming Knot:* Solid subtle grey (`#E3E5E8`) 10px dot.

### 3. Cards & Journey Modules
- Surface `#FFFFFF`, 1px solid `#E3E5E8`, `rounded-[20px]`, `p-6` (24px padding), `mx-4` (16px margins), `shadow-none`.
- **Journey Card Seal:** A small circular completion stamp anchored at the top-right corner. Only when the journey milestone is complete does the seal receive a solid `#FFB020` fill; otherwise, it remains an unfulfilled hairline ring (`#E3E5E8`).

### 4. Form Inputs & Controls
- **Text Inputs:** Height 48px, background `#FFFFFF`, border 1px solid `#E3E5E8`, `rounded-xl` (12px), text `#1A1A1B`, placeholder `#8A8D94`. Active focus shifts border to `#1A1A1B` (1px, crisp).
- **Checkboxes & Radios:** 20px pill/circular containers. Unselected: 1.5px border `#E3E5E8`. Completed/Selected: Solid `#FFB020` fill with white indicator mark.

### 5. Chips & Filters
- Compact pill height (32px), `rounded-full`, padding 0 14px.
- Inactive: `#FFFFFF` fill with 1px `#E3E5E8` border, text `#6B6F76`.
- Active: `#EDEEF0` fill, borderless, text `#1A1A1B`.
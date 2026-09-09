---
name: Kinetic Companion
colors:
  surface: "#fbf9f4"
  surface-dim: "#dbdad5"
  surface-bright: "#fbf9f4"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f4ee"
  surface-container: "#efeee8"
  surface-container-high: "#e9e8e3"
  surface-container-highest: "#e4e2dd"
  on-surface: "#1b1c19"
  on-surface-variant: "#41493a"
  inverse-surface: "#30312d"
  inverse-on-surface: "#f2f1eb"
  outline: "#717a68"
  outline-variant: "#c1cab5"
  surface-tint: "#2f6c00"
  primary: "#2f6c00"
  on-primary: "#ffffff"
  primary-container: "#a2e775"
  on-primary-container: "#2d6900"
  inverse-primary: "#94d968"
  secondary: "#47672d"
  on-secondary: "#ffffff"
  secondary-container: "#c5eba3"
  on-secondary-container: "#4b6b31"
  tertiary: "#2e6c00"
  on-tertiary: "#ffffff"
  tertiary-container: "#a0e774"
  on-tertiary-container: "#2c6900"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#aff681"
  primary-fixed-dim: "#94d968"
  on-primary-fixed: "#092100"
  on-primary-fixed-variant: "#225100"
  secondary-fixed: "#c8eea5"
  secondary-fixed-dim: "#acd28c"
  on-secondary-fixed: "#0c2000"
  on-secondary-fixed-variant: "#304f17"
  tertiary-fixed: "#aef681"
  tertiary-fixed-dim: "#93d968"
  on-tertiary-fixed: "#092100"
  on-tertiary-fixed-variant: "#215100"
  background: "#fbf9f4"
  on-background: "#1b1c19"
  surface-variant: "#e4e2dd"
typography:
  balance-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: "800"
    lineHeight: 42px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: "800"
    lineHeight: 36px
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: "800"
    lineHeight: 30px
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: "800"
    lineHeight: 26px
    letterSpacing: -0.02em
  currency-stat:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: "800"
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: "700"
    lineHeight: 23px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "700"
    lineHeight: 21px
    letterSpacing: 0em
  amount-tabular:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 19px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 22px
    letterSpacing: 0em
  button-text:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "800"
    lineHeight: 20px
    letterSpacing: -0.01em
  meta-regular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 17px
    letterSpacing: 0.005em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: "800"
    lineHeight: 13px
    letterSpacing: 0.06em
  caption-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "400"
    lineHeight: 14px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

## Brand & Style

### Personality & Emotional Thesis

The design system delivers an energetic, ultra-reliable, and tactile companion experience built for on-the-go global travel and instant productivity execution. Fusing the razor-sharp clarity of high-performance modern fintech with the dynamic empathy of an autonomous AI copilot, the interface instills effortless momentum, precision, and confidence. The aesthetic combines bold typography, stark black-on-white clarity, and high-voltage chartreuse highlights anchored by deep British racing forest greens.

### Design Movement: High-Contrast Tactile Modern

- **Purity of Surface**: Crisp `#FFFFFF` canvas and subtly recessed `#F7F7F7` zones establish structured hierarchy without relying on artificial drop shadows or heavy skeuomorphism.
- **Punchy Geometric Tension**: Monumental, tightly tracked geometric sans-serif headings juxtapose against ultra-legible tabular figures, micro-caps labels, and clean conversational bubbles.
- **Physical Responsiveness**: Interactive pills, dynamic tool tags, and artifact cards possess a crisp, physical presence—responding with instantaneous 0.98x spring scales, hairline borders, and targeted haptic pulses.
- **Autonomous Clarity**: Travel itineraries, currency calculations (RM), flight details, and channel connectors (WhatsApp, Telegram) are represented through structured artifact modules rather than loose wall-of-text chat logs.

## Colors

### The Atmospheric Palette

The system is built light-first, where high-luminance canvases are disciplined by dense, near-black typography and commanding forest green anchors.

- **Primary Action (`#9FE870`)**: A vivid electric chartreuse green used exclusively for primary calls-to-action, user active states, selection confirmations, and highlight moments. It carries deep forest green text (`#163300`) to maximize legibility and WCAG AAA compliance.
- **Anchor Dark (`#163300`)**: Deep organic forest green. Utilized for hero cards, sticky interactive drawers, primary navigational status headers, and bold agent state toggles.
- **Supportive Tints (`#EAF9DC`, `#8AD45C`)**: Soft luminous chartreuse tints isolate active agent dialogue sections, badge highlights, and fee or budget summaries without jarring the user’s reading flow.
- **Neutral Hierarchy**:
  - `canvas` (`#FFFFFF`): Pristine, high-contrast base for primary screens and active white cards.
  - `surface` (`#F7F7F7`): Clean background for chat streams, container blocks, and inactive card states.
  - `surface-sunken` (`#EFEFEF`): Recessed inputs, active step rails, and pressed tab segments.
  - `divider` (`#E5E5E5`) and `border` (`#D2D2D2`): Precise 0.5px to 1px separation lines maintaining architectural discipline.
- **Semantic Signals**: Dedicated status tones for booking and transaction states (`#2F8F4E` for confirmed bookings, `#B5781E` for pending itineraries/quotes, and `#D4332B` for failed API calls or cancellations), paired with official platform branding for WhatsApp and Telegram channel linkages.

## Core Rules

- Use extreme minimalism.
- No subtext
- No descriptive helper text
- No bottom navigation bar
- No tab bar
- No dashboard layout
- No unnecessary labels
- No decorative sections
- One primary action per screen
- Large typography
- Large spacing
- Minimal icons
- Minimal borders
- Large rounded corners
- Premium modern iOS-inspired feel
- Use visual hierarchy instead of explanatory text
- Keep every screen visually calm and sparse

## Typography

### Structural Hierarchy & Principles

The typography is unapologetically punchy, geometric, and designed for rapid scanning under varying real-world conditions.

- **Primary Geometry (Plus Jakarta Sans)**: Governs bold display headlines, action triggers, balance numbers, and navigation headers. It provides geometric character and structural authority reminiscent of Wise Sans.
- **Functional Body & Conversational Flow (Inter)**: Powers message bubbles, generated travel briefs, itinerary schedules, and prompt suggestions. Provides exceptional micro-legibility at 13px–15px with neutral mechanical balance.
- **Tabular Figures & Currency Rules**: All financial balances, trip budgets in Malaysian Ringgit (RM), room night costs, and departure timestamps must enforce OpenType tabular figures (`font-variant-numeric: tabular-nums`). This guarantees columnar alignment across line-item breakdowns, quote comparators, and animated roll-up figures.
- **Uppercase Labels**: Category headers, tool execution markers, and flight codes leverage `label-caps` (`11px / 800 weight / 0.06em letter-spacing / uppercase`) to provide an unmistakable architectural rhythm.

## Layout & Spacing

### Mobile-First Conversational Chassis

The structural model utilizes a dedicated conversational shell that transitions into responsive modular drawers:

- **Rhythm & Base Unit**: Strict 4px/8px incremental grid. Standard content blocks default to `16px` (`space-base`) exterior margins on mobile viewports, increasing to `24px` on tablet/desktop environments.
- **Chat Feed Architecture**:
  - Chat bubbles utilize a vertical stack rhythm of `12px` (`chat-bubble-gap`) between consecutive conversational turns and `4px` between grouped messages from the same sender.
  - Message bubble content is bounded by a maximum mobile width of 85% to maintain ergonomic reading scan lines.
  - Sticky bottom action dock is anchored with a safe margin bottom + `12px` vertical padding, isolating the input bar from keyboard travel and device gesture handles.
- **Responsive Breakpoints**:
  - **Mobile (< 768px)**: 1-column conversational stream with fixed-bottom input drawer and slide-up modal bottom sheets for artifacts (itineraries, maps, booking receipts).
  - **Tablet (768px – 1024px)**: Fluid dual-panel canvas. 45% left-hand persistent chat thread, 55% right-hand live interactive artifact canvas (timeline, calendar exports, Airbnb cards).
  - **Desktop (> 1024px)**: Fixed maximum centered container of `1280px` or dual workspace columns (420px chat sidebar + expansive multi-card workspace).

## Elevation & Depth

### Flat Architectural Stacking & Ghost Borders

Visual hierarchy is established primarily through clean planar surfaces and crisp outlines rather than heavy simulated lighting or diffuse skeuomorphic blurs.

- **Level 0 (Canvas Base)**: Pure `#FFFFFF` or `#F7F7F7` backdrop. Zero shadow. Used as the underlying foundation for the conversation stream.
- **Level 1 (Card & Bubble Containers)**: Pure `#FFFFFF` cards resting on `#F7F7F7` surfaces, framed with a 1px solid `#E5E5E5` hairline border. Shadows are avoided; separation is achieved through precise tonal contrast.
- **Level 2 (Active Artifacts & Forest Heros)**: Deep Forest `#163300` surfaces or highlighted `#EAF9DC` tiles. When elevated over dynamic map layers or floating itinerary drawers, elements utilize a deep tinted contact drop shadow: `box-shadow: 0px 12px 24px -4px rgba(14, 34, 0, 0.16)`.
- **Level 3 (Modals & Sheet Drawers)**: High-priority overlays feature backdrop blur (`backdrop-filter: blur(8px)`) paired with semi-opaque scrim (`rgba(14, 15, 12, 0.4)`), drawing user focus into onboarding flows or date-range pickers.

## Shapes

### Controlled Curvilinear Geometry

The shape system operates at **Level 2 (Rounded)** with purposeful variations designed for tactile thumb engagement:

- **Standard Elements & Cards (`rounded-lg` / 16px / `1rem`)**: Default radius for primary action buttons, tool execution preview containers, agent artifact cards, and fee breakdowns.
- **Chat Bubbles & Hero Modules (`rounded-xl` / 20px–24px / `1.25rem–1.5rem`)**: Agent and user chat bubbles employ smooth 20px corners, with agent bubbles squared off to 6px at the top-left touchpoint, and user bubbles squared off at the bottom-right touchpoint.
- **Interactive Tags & Toggles (`rounded-full` / 9999px)**: Quick prompt suggestion pills, platform badges (WhatsApp, Telegram), currency tags, and tool execution status badges use continuous pill curvature for effortless, thumb-friendly tapping.

## Components

### 1. Primary & Secondary Buttons

- **Primary Action (Bright Green)**: Min-height 52px, radius 16px. Background `#9FE870`, text `#163300` in `button-text` typography. Pressed state transforms to 0.98 scale and fills `#8AD45C`. Light haptic trigger on tap.
- **Secondary Forest Button**: Min-height 52px, radius 16px. Background `#163300`, text `#FFFFFF`. Pressed state switches to `#0E2200`.
- **Ghost Action Pill**: Min-height 36px, radius 9999px. Background `#F7F7F7`, border 1px solid `#D2D2D2`, text `#0E0F0C`.

### 2. Conversational Bubbles & Tool Execution Pills

- **User Bubble**: Background `#163300`, text `#FFFFFF` in `body-md`. Rounded 20px, bottom-right corner 6px.
- **Agent Bubble**: Background `#FFFFFF`, border 1px solid `#E5E5E5`, text `#0E0F0C` in `body-md`. Rounded 20px, top-left corner 6px. Contains agent signature mark in `#9FE870`.
- **Tool Execution Status Pill**: Inline container with background `#F7F7F7`, border 1px solid `#E5E5E5`, radius 9999px, padding 4px 12px. Displays status icon (Airbnb, Web Search, Google Maps API) alongside animated pulsing green indicator dot (`#9FE870`, 8px) and uppercase status text in `label-caps`.

### 3. Agent Artifact Cards

- **Itinerary Timeline Tile**: `#FFFFFF` background with 16px radius and 1px `#E5E5E5` border. Features an integrated vertical spine rail in `#163300` with 8px circular nodes marking morning, afternoon, and evening travel segments.
- **Booking & Fee Transparency Card**: Alternating itemized rows with 1px `#E5E5E5` horizontal dividers. Highlighted total budget row adopts a `#EAF9DC` tint container with `#163300` bold typography and formatted tabular figures (e.g., `RM 1,450.00`).
- **1-Tap Calendar Export**: Dual action button set docked inside the card footer providing instant direct bindings for Apple Calendar and Google Calendar sync.

### 4. Conversational Onboarding Controls

- **Interactive Step Cards**: Segmented card containers tracking destination search, guest counter incrementors (`-` and `+` steppers), and dietary preference toggles (Halal, Vegan, Gluten-Free).
- **Budget Slider in Ringgit Malaysia (RM)**: Custom range track with `#EFEFEF` background, active bar in `#163300`, and 28px draggable thumb in `#9FE870` paired with dynamic real-time tabular balance updates above.
- **Vibe Recommendation Chips**: Selectable tag pills featuring border `#D2D2D2`. When selected, fill transforms immediately to `#9FE870` with text `#163300` and hairline border `#8AD45C`.

### 5. Channel Connectors & Tactical Bottom Bar

- **Platform Connect Badges**: WhatsApp (`#25D366`) and Telegram (`#229ED9`) status chips showing active sync or one-click connect toggles.
- **Persistent Bottom Chat Dock**: Edge-to-edge white container with 0.5px `#E5E5E5` top border. Houses an auto-expanding input field (`#F7F7F7` fill, 16px radius, placeholder in `#9A9D95`), camera/attachment trigger, and circular Send action button (`#9FE870` fill with `#163300` arrow icon).

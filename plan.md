# ArcMarket UI Update Plan

## Overview

Update the existing ArcMarket frontend to match the new design guideline — a darker, more immersive aesthetic with Indigo/Violet primary colors, glass morphism effects, larger rounded corners (3xl), richer card designs with image areas, and a new footer component.

---

## Summary of Changes

| Area | Current | Target |
|------|---------|--------|
| **Primary color** | OpenSea Blue `#2081E2` | Indigo `#6366f1` |
| **Secondary/Accent** | Purple `#8B5CF6` | Violet `#8b5cf6` / Cyan `#06b6d4` |
| **Dark backgrounds** | Neutral grays (`#111827`, `#1F2937`) | Slate tones (`#0f172a`, `#1e293b`) |
| **Border radius** | Mostly `rounded-2xl` | Predominantly `rounded-3xl` |
| **Hero** | Split left/right with glass-panel | Full 12-col grid: 8-col hero + 4-col live-stats sidebar |
| **Notable Drops** | Text-only cards | Image cards with placeholder art, price overlay, bid buttons |
| **Product cards** | Gradient blue/purple | Deep blue/purple backgrounds with oversized material icons |
| **Categories** | All emoji icons | Mix of emojis + Lucide icons with colored backgrounds |
| **Navbar search** | Button opens command palette | Inline search input (still triggers command palette) |
| **Footer** | None | New footer with logo, copyright, and legal links |

---

## Step-by-Step Implementation

### Step 1: Update Color System & Design Tokens

**Files:** `tailwind.config.js`, `globals.css`

- Add new color tokens:
  - `primary` scale: base `#6366f1` (Indigo 500)
  - `secondary`: `#8b5cf6` (Violet 500)
  - Add `accent`: `#06b6d4` (Cyan 500)
  - Dark backgrounds: `background-dark: #0f172a`, `surface-dark: #1e293b`
  - Glass tokens: `glass-dark: rgba(30,41,59,0.7)`, `glass-border: rgba(255,255,255,0.1)`
- Update CSS custom properties in `globals.css` to match new palette
- Add `neon-text` utility class (text-shadow with primary glow)
- Update `.card-hover` to include the new box-shadow and border-color animation from the guideline
- Add custom scrollbar styles for dark mode (`::-webkit-scrollbar` on body)

### Step 2: Update Navbar (`src/components/Navbar.tsx`)

**Changes:**
- Swap the Sparkles logo icon for a gradient `token`-style icon using Lucide `Hexagon` or a custom SVG
- Add visible inline search input on `lg:` screens (rounded-full, `w-64`, `pl-10`, `⌘K` badge) — clicking it still opens the command palette via `open()`
- Move "Launch" and "Create" as separate pill buttons between the nav links and right-side actions (matching guideline's purple/indigo pill buttons)
- Simplify desktop nav to: Explore dropdown, Stats, Rewards (remove Launch/Create from the nav link list — they become CTA buttons)
- Update "Connect Wallet" button to rounded-full with outlined style matching the guideline
- Add user avatar placeholder (gradient circle, `from-pink-500 to-orange-400`)
- Add red notification dot on the bell icon
- Update backdrop blur/border styles to match guideline: `backdrop-blur-md bg-white/80 dark:bg-background-dark/80 border-b border-gray-200 dark:border-gray-800`

### Step 3: Redesign Hero Section (`src/app/page.tsx`)

**Changes:**
- Switch from 2-column split layout to 12-column grid (`lg:grid-cols-12`):
  - **Left (8 cols):** Hero content with dark `surface-dark` background, `rounded-3xl`, decorative gradient blur circles (absolute positioned), "Featured Drop" badge, large heading with gradient text animation, two CTA buttons, live-pulse indicator
  - **Right (4 cols):** Live Stats panel with recent sale items (cards with image + name + price), a small SVG volume chart at the bottom
- Add animated gradient blur decorations (pseudo-elements or absolute-positioned divs)
- Keep the auto-rotating carousel for hero slides
- Add the pulsing green "Mint live" indicator

### Step 4: Redesign Product Cards Section (`src/app/page.tsx`)

**Changes:**
- Update NFT Marketplace card:
  - Background: deep blue `bg-[#0f3460]` with `border-blue-500/20`
  - Gradient overlay on hover
  - Oversized Lucide `Store` icon in top-right with low opacity (`text-blue-500/10`)
  - Larger text (3xl heading), more descriptive copy
- Update Token Launchpad card:
  - Background: deep purple `bg-[#2e1065]` with `border-purple-500/20`
  - Same pattern: gradient overlay, oversized `Rocket` icon, larger text
- Both cards: `rounded-3xl`, `p-8`, smooth hover transitions

### Step 5: Redesign Notable Drops Section (`src/app/page.tsx`)

**Changes:**
- Switch layout to `lg:grid-cols-12`: Notable Drops in 8 cols, Live Activity in 4 cols
- Redesign drop cards to include:
  - Image area (`h-48`) with gradient placeholder and centered Lucide icon
  - Price badge overlay (top-right, `bg-black/60 backdrop-blur`)
  - Card body with title, artist name, "Ends in" timer, and "Bid" button
  - Hover: border changes to `primary/50`, icon scales up
- Show 2 cards in `sm:grid-cols-2` grid (instead of up to 8 text cards)
- Move Live Activity panel into the same grid row as Notable Drops (right column)

### Step 6: Update Live Activity Sidebar (`src/app/page.tsx`)

**Changes:**
- Restyle to `bg-surface-dark rounded-3xl p-6 border border-gray-800`
- Add "Live Activity" label with "Real-time trades" subheading
- Filter buttons: "All" gets white bg + black text when active; "Sales"/"Listings" get `bg-gray-800` outline style
- Add chart placeholder area at the bottom (`bg-background-dark/50 rounded-xl border border-gray-800`) with Material-style bar chart icon and loading message

### Step 7: Update Browse by Category (`src/app/page.tsx`)

**Changes:**
- Update category data to include colored icon backgrounds:
  - Art: orange bg, emoji 🎨
  - Gaming: purple bg, Lucide `Gamepad2` icon
  - Music: blue bg, Lucide `Music` icon
  - Photography: pink bg, Lucide `Camera` icon
  - Sports: yellow bg, emoji 🏆
  - Utility: cyan bg, Lucide `Wrench` icon
  - AI: red bg, Lucide `Bot` icon
  - Fashion: indigo bg, Lucide `Shirt` icon
- Card styling: `bg-surface-dark border-gray-800 rounded-2xl hover:border-primary/50`
- Add icon wrapper div: `w-10 h-10 rounded-lg bg-{color}-500/10 flex items-center justify-center`
- Update subtitles to match guideline ("Curated picks", "Metaverse assets", "Audio NFTs", etc.)

### Step 8: Add Footer Component

**New file:** `src/components/Footer.tsx`

- Structure:
  - `mt-20 border-t border-gray-200 dark:border-gray-800`
  - Max-width container with flex between logo and links
  - Left: small logo + "ArcMarket" + `© 2023 Inc.` text
  - Right: Privacy Policy, Terms of Service, Help Center links
  - Responsive: column on mobile, row on desktop

**Update:** `src/app/layout.tsx`
- Import and render `<Footer />` after `<main>` and before the close of the content wrapper

### Step 9: Update Global Styles (`globals.css`)

**New/updated utilities:**
- `.neon-text` text-shadow effect
- Updated `.card-hover` with indigo glow shadow and border color on hover
- Global scrollbar styling for dark mode (`::-webkit-scrollbar-track: #0f172a`, thumb: `#334155`)
- Ensure `surface-dark` and `background-dark` work in the CSS variable system

### Step 10: Test & Verify

- Run `npm run lint` to verify no ESLint issues
- Run `npm run type-check` to verify TypeScript compiles
- Run `npm test` to verify existing tests still pass
- Visually verify dark mode styling matches guideline
- Verify mobile responsiveness (navbar, hero, cards, categories, footer)

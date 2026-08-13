# UX Audit: Homepage and Global Navigation

**Scope:** Live ARC homepage and shared shell (header, sub-bars, footer, command palette, mobile nav).  
**Baseline:** Post–baseline alignment (origin/main).  
**Reference:** Live snapshot and codebase review of `layout.tsx`, `Navbar.tsx`, `HomeContent.tsx`, `Footer.tsx`.

---

## Post-implementation review summary (current state)

After the shell/navigation overhaul, the following audit items were **resolved**:

- **Meta bars removed**: Layout "ARC shell" bar and Navbar "Current route" bar were removed; no duplicate bars below header on mobile.
- **Launch vs Launchpad**: Footer and nav now consistently use "Launchpad"; "Launch again" was replaced with "Launchpad."
- **Footer Connect wallet**: Footer "Connect wallet" now triggers the wallet connect surface (desktop: wallet dropdown; mobile: opens hamburger where Connect wallet action lives when disconnected).
- **Notification dot**: Always-on red dot on the bell was removed.
- **Keyboard accessibility**: Escape closes all dropdowns; focus returns to trigger; Explore supports Enter/Space, ArrowDown into menu, ArrowUp/Down/Home/End within menu; Explore closes on item select.
- **Home on mobile**: Home was added as the leftmost item in the bottom nav; Rewards was removed from the bottom nav; Rewards is surfaced via Quick actions (Rewards + Launchpad) at the top of the hamburger drawer.
- **Mobile chrome**: Top bar and bottom nav use solid backgrounds on mobile; hamburger panel is solid; top bar height reduced on mobile (h-14).
- **Home active state**: Home in the bottom nav is active only when `pathname === '/'`.
- **Homepage copy**: Hero pill uses "Home"; shell-branding language removed from shared shell and page-level copy (Navbar, Footer, HomeContent, Explore, Rewards, Launch, Studio, Settings, Profile, Token pages). Copy is now contextual (e.g. "Marketplace," "Platform," "Entry point," "Discovery") with no "ARC shell" or "Connected shell" in live UI.
- **Footer wallet on mobile**: When connected, the hamburger drawer now shows a Wallet block (Manage Wallets, Disconnect); footer "Connect wallet" opens the drawer so connected users can manage the wallet without the desktop header.
- **Menu accessibility**: Wallet and profile menus have `role="menuitem"` on all focusable items; arrow-key roving (ArrowUp/Down, Home/End) and Tab/Shift+Tab focus trap added so behavior matches Explore.
- **Safe area**: Bottom nav uses `safe-bottom` (globals.css); Tailwind `theme.extend.spacing` includes `safeAreaBottom`, `safeAreaTop`, etc.; documented for fixed bottom/top chrome.

**Remaining gaps**: None from the last review pass.

---

## 1. Information hierarchy and primary actions (original audit)

| Finding | Severity | Detail |
|--------|----------|--------|
| **Meta / internal messaging in shell** | High | Layout includes a full-width bar under the navbar: "ARC shell" + "Primary navigation now keeps exploration, launchpad, studio, stats, and rewards in one place…" and "One owner per destination." Navbar adds a second bar: "Current route" + shellContext title/description + "Primary nav + utility split." These read as internal/designer copy, add visual noise, and push main content down. Best-in-class shells avoid explaining the shell in the UI. |
| **Duplicate primary CTAs** | Medium | Homepage hero has "Launch a token," "Explore marketplace," "View stats." The same destinations are in the primary nav (Launchpad, Explore, Stats). Hierarchy is unclear: hero and nav compete. Recommend one clear primary path from home (e.g. Launch or Explore) and treat the other as secondary, or make hero CTAs explicitly "shortcuts" to nav destinations. |
| **No single primary nav CTA** | Medium | All five primary nav items (Explore, Launchpad, Studio, Stats, Rewards) share the same visual weight. For conversion and clarity, one primary action (e.g. Launch or Explore) could be emphasized (e.g. style or position) so the "next best move" is obvious. |

---

## 2. Route clarity and terminology (original audit)

| Finding | Severity | Detail |
|--------|----------|--------|
| **Launch vs Launchpad** | Low | Footer uses "Launch" (e.g. "Launch again"); nav uses "Launchpad." Align on one label (e.g. "Launchpad" everywhere or "Launch" everywhere) to avoid confusion. |
| **"Launch again" in footer** | Low | Account section links "Launch again" → `/launch`. Wording is odd; "Launch" or "Launch token" is clearer. |
| **Connect wallet → /profile** | Low | Footer "Connect wallet" links to `/profile`. If the user is disconnected, a direct connect action (e.g. open connect modal) would be more helpful than a profile page. |

---

## 3. Discoverability and consistency (original audit)

| Finding | Severity | Detail |
|--------|----------|--------|
| **Home not in bottom nav** | Medium | Mobile bottom nav has Explore, Launchpad, Studio, Stats, Rewards. "Home" is only in the slide-out utility list. Users who expect "Home" in the tab bar may not find it. Either add Home to the bottom nav or make the logo tap clearly go to home and keep Home in the drawer. |
| **Explore dropdown vs nav** | Low | Explore dropdown (All inventory, Listings, Auctions, Token markets) is clear. Nav label "Explore" matches. No issue. |
| **Footer mirrors nav** | Positive | Footer Platform (Explore, Launch, Studio, Stats) and Discovery (All inventory, Auctions, Token markets, Rewards) align with nav and explore dropdown. Good for re-discovery. |

---

## 4. Mobile behavior (original audit)

| Finding | Severity | Detail |
|--------|----------|--------|
| **Two persistent bars on mobile** | High | On small screens, the layout "ARC shell" bar and the Navbar "Current route" bar both sit under the header. That’s a lot of chrome before content. Consider collapsing to one line, moving context into the page, or removing meta copy on mobile. |
| **Mobile menu structure** | Low | Slide-out has Primary navigation, Explore shortcuts, Utility (Home, Profile, Settings). Structure is clear; ensure touch targets and spacing meet accessibility guidelines. |
| **Safe area** | Low | Bottom nav uses `safe-area-inset-bottom`. Confirm on notched devices that content isn’t obscured. |

---

## 5. Trust and status cues (original audit)

| Finding | Severity | Detail |
|--------|----------|--------|
| **Notification dot always on** | Medium | Bell icon has a permanent red dot. If there is no real notification state, this can mislead. Use the dot only when there are unread notifications, or remove until notifications are implemented. |
| **Profile avatar placeholder** | Low | Profile button is a gradient circle (no avatar). Acceptable as placeholder; when profile images exist, use them for recognition. |
| **Wallet state** | Positive | Connect / address state in header is clear. Wallet dropdown (Manage Wallets, Disconnect) is understandable. |

---

## 6. Accessibility and interaction (original audit)

| Finding | Severity | Detail |
|--------|----------|--------|
| **Skip link** | Positive | "Skip to main content" is present. Good. |
| **Explore dropdown keyboard** | Medium | Explore is a hover dropdown. Ensure it opens on focus and that keyboard users can reach all sub-links and close without a mouse. Add focus trap and Escape to close. |
| **Wallet and profile dropdowns** | Medium | Same as above: keyboard focus, focus trap, and Escape to close so all actions are reachable without a mouse. |
| **ARIA and labels** | Low | Buttons use `aria-label` (e.g. "Open search," "Notifications," "Open menu"). Verify all icon-only buttons have labels and that "Current route" region is not announced redundantly. |

---

## 7. Original recommended actions (many implemented)

The following were recommended in the initial audit; items 1, 3, 4, 5, 6, and 7 have been addressed in the current shell. Item 2 remains optional.

1. ~~Remove or drastically reduce meta shell copy~~ — **Done:** both bars removed.
2. **Clarify primary action** on homepage and in nav — Optional; not yet changed.
3. ~~Unify "Launch" vs "Launchpad" and fix "Launch again"~~ — **Done.**
4. ~~Revisit mobile chrome~~ — **Done:** solid top/bottom, no duplicate bars.
5. ~~Notification dot only when unread (or remove)~~ — **Done:** dot removed.
6. ~~Explore, wallet, profile dropdowns keyboard-accessible~~ — **Done:** Escape, focus return, arrow nav.
7. ~~Home placement on mobile~~ — **Done:** Home in bottom nav (left); Rewards in drawer Quick actions.

See the "Post-implementation review summary" at the top for remaining gaps.

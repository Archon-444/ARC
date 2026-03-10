# Shell & Navigation Regression Checklist

Use this checklist before shipping shell or nav changes to avoid broken flows and accessibility regressions.

## Desktop

- [ ] **Header**: Logo links to `/`; primary nav (Explore, Launchpad, Studio, Stats, Rewards) links work; Explore dropdown shows All inventory, Listings, Auctions, Token markets and links work.
- [ ] **Search**: Search input / ⌘K opens command palette; placeholder and shortcut visible.
- [ ] **Notifications**: Bell icon present; no misleading always-on dot (dot only when unread exists).
- [ ] **Theme**: Toggle switches light/dark; shell and content respect `dark` class.
- [ ] **Wallet**: Connect Wallet opens wallet dropdown; when connected, address shown and Manage Wallets / Disconnect work; Circle and External Wallet options when disconnected.
- [ ] **Profile**: Profile button opens dropdown; Profile, Cart, Settings links work.
- [ ] **Keyboard**: Tab through header; Explore button opens/closes with Enter/Space; Escape closes Explore, wallet, and profile dropdowns; focus returns to trigger. Wallet and profile menus: all items have role="menuitem", ArrowUp/Down/Home/End and Tab/Shift+Tab roving, focus trapped until Escape. Focus visible on all interactive elements.

## Mobile

- [ ] **Header**: Logo, search icon, notifications, theme, profile, hamburger visible; no duplicate or overlapping bars below header (one clean header); solid background (no transparency) on mobile.
- [ ] **Bottom nav**: Home (left), Explore, Launchpad, Studio, Stats; Home active only on `/`; other items use path-based active state; solid background; safe area respected on notched devices (uses `safe-bottom` from globals.css; Tailwind spacing `safeAreaBottom` / `pb-safeAreaBottom` available).
- [ ] **Hamburger menu**: Opens slide-out (solid background). Contains: Current route card (title + description), Quick actions (Rewards + Launchpad), Primary navigation (Explore, Launchpad, Studio, Stats, Rewards), Explore shortcuts, Wallet block when connected (Manage Wallets, Disconnect), Utility (Connect wallet when disconnected, Home, Profile, Settings). Close button works.
- [ ] **Footer "Connect wallet"**: On mobile, clicking it opens the hamburger menu. When disconnected, "Connect wallet" in drawer utility triggers connect flow; when connected, drawer shows Wallet block with Manage Wallets and Disconnect.
- [ ] **Tap targets**: Buttons and links at least 44px; no accidental taps.

## Routes

- [ ] `/` → Home (HomeContent).
- [ ] `/explore` and `/explore?tab=*` → Explore page.
- [ ] `/launch` → Launch page.
- [ ] `/studio` → Studio page.
- [ ] `/stats` → Stats page.
- [ ] `/rewards` → Rewards page.
- [ ] `/profile` and `/profile/[address]` → Profile.
- [ ] `/settings` → Settings.
- [ ] Footer Platform / Discovery / Account links match above and work.

## Accessibility

- [ ] Skip to main content present and works.
- [ ] Focus order logical; no focus trap except inside modals/dropdowns when open.
- [ ] ARIA: Explore, wallet, and profile menus have role="menu" and all focusable children role="menuitem"; Explore/wallet/profile triggers have aria-expanded, aria-haspopup, aria-controls; icon-only buttons have aria-label.
- [ ] Reduced motion: Respect `prefers-reduced-motion` (globals.css already reduces animation when set).

## Design system

- [ ] No new hardcoded colors in shell; use Tailwind theme or globals.css tokens.
- [ ] Shared components (Button, Card, etc.) use `cn()` for class merging.

## Known gaps (next implementation pass)

The following were previously listed and have been addressed:

- **Footer wallet on mobile** — Resolved: mobile drawer now shows a Wallet block (Manage Wallets, Disconnect) when connected; footer "Connect wallet" opens the drawer so connected users can manage the wallet from there.
- **Menu accessibility** — Resolved: wallet and profile menus have `role="menuitem"` on all focusable items; arrow-key roving (ArrowUp/Down, Home/End) and Tab/Shift+Tab focus trap added to match Explore.
- **Safe area** — Resolved: bottom nav uses `safe-bottom` (globals.css); Tailwind `theme.extend.spacing` includes `safeAreaBottom`, `safeAreaTop`, etc.; BottomNavigation.tsx uses `h-safeAreaBottom` and `pb-safeAreaBottom` where used.

No open shell gaps remain from the last review. When adding new fixed bottom/top chrome, use `safe-bottom` or `pb-safeAreaBottom` for notched devices.

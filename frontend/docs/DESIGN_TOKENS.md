# Design Tokens Strategy

This document defines the single source of truth for the ARC frontend design system so that shell and component work stays consistent.

## Canonical sources

| Token type | Canonical source | Usage |
|------------|------------------|--------|
| **Color palette** (primary, accent, secondary, neutral, semantic) | `tailwind.config.js` → `theme.extend.colors` | Use Tailwind utilities: `bg-primary-500`, `text-neutral-600`, `border-error-500`, etc. |
| **Spacing, radius, font size, font weight** | `tailwind.config.js` → `theme.extend` | Use Tailwind utilities: `p-4`, `rounded-xl`, `text-sm`, etc. |
| **Shadows, animation keyframes** | `tailwind.config.js` → `theme.extend.boxShadow`, `keyframes` | Use Tailwind: `shadow-lg`, `animate-fade-in`, etc. |
| **Semantic and component tokens** | `src/app/globals.css` (CSS custom properties) | Use where Tailwind is not enough: `var(--color-bg-primary)`, `var(--card-border)`, `var(--transition-base)`, dark-mode overrides, and non-utility CSS (e.g. `.card`, `.btn-primary`). |

## globals.css role

- **Semantic tokens**: `--color-bg-primary`, `--color-text-primary`, `--color-border`, `--color-divider`, etc. Used for components that need theme-aware values in custom CSS or for consistency with the animated background.
- **Component tokens**: `--card-*`, `--button-radius`, `--input-radius`, `--modal-bg`, `--z-*`, `--transition-*`, `--shadow-*` (where referenced from component classes).
- **Dark mode**: `@media (prefers-color-scheme: dark)` and `[data-theme="dark"], .dark` override semantic and component tokens. Tailwind dark mode uses `dark:` variants driven by `darkMode: 'class'` in config.

## Shared primitives

- **Button**: `frontend/src/components/ui/Button.tsx` – uses `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-sm`, `.btn-lg` from globals.css. All variants and sizes are defined so the component does not rely on undefined classes.
- **Card**: Uses `.card`, `.card-hover` from globals.css; padding via component prop.
- **Input**: Uses `.input` from globals.css; error/disabled states use Tailwind semantic colors.
- **Badge**: Uses Tailwind palette only (primary-, success-, warning-, error-, neutral-, accent-). No globals.css dependency.
- **Tabs, Modal, EmptyState, Skeleton, Toast, Pagination**: Prefer Tailwind utilities and the semantic/component tokens above for consistency.

## Rules

1. **No duplicate palettes**: Do not redefine the full color palette in globals.css; Tailwind is the single palette source. Only semantic aliases (e.g. `--color-text-primary`) and dark overrides belong in globals.
2. **Class merging**: Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) so conflicting Tailwind classes resolve correctly.
3. **New components**: Use `theme.extend` in tailwind.config.js for new scale values; use globals.css only for semantic/component tokens that need to be referenced in raw CSS or that change with dark mode in a single place.

## Current implementation note

The above describes the intended token strategy. In practice, several shell components (Navbar, Footer, HomeContent) still use hardcoded Tailwind color classes (e.g. `blue-600`, `gray-400`, `slate-950`, `emerald-500`) alongside theme tokens. New shell work should prefer `primary-*`, `neutral-*`, and semantic tokens where possible; existing hardcoded usage can be migrated incrementally. Fixed bottom/top chrome should use safe-area utilities: globals `.safe-bottom` / `.safe-top` or Tailwind `pb-safeAreaBottom` / `pt-safeAreaTop` (see [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md#known-gaps-next-implementation-pass) for resolved shell gaps).

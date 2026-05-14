import { test, expect } from '@playwright/test';

/**
 * Visual regression tests — screenshot-based guardrails for UI consistency.
 *
 * These capture full-page screenshots at desktop (1440×900) and mobile (375×667)
 * for the 5 core routes. On first run they create baseline images in
 * e2e/__screenshots__/. Subsequent runs diff against them.
 *
 * Run:   npx playwright test visual-regression --update-snapshots   (to reset baselines)
 *        npx playwright test visual-regression                      (to compare)
 */

const ROUTES = [
  { name: 'homepage', path: '/' },
  { name: 'explore', path: '/explore' },
  { name: 'explore-tokens', path: '/explore?tab=tokens' },
  { name: 'launch', path: '/launch' },
];

// Desktop: 1440×900
test.describe('Visual regression — Desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of ROUTES) {
    test(`${route.name} @ desktop`, async ({ page }) => {
      await page.goto(route.path);

      // Wait for network idle + any skeleton animations to settle
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${route.name}-desktop.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

// Mobile: 375×667 (iPhone SE)
test.describe('Visual regression — Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const route of ROUTES) {
    test(`${route.name} @ mobile`, async ({ page }) => {
      await page.goto(route.path);

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`${route.name}-mobile.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

// Mobile nav interaction: hamburger open state
test.describe('Visual regression — Mobile nav', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile menu open state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open hamburger menu
    const menuButton = page.locator('button[aria-label*="menu"]')
      .or(page.locator('[data-testid="mobile-menu"]'));

    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();
      await page.waitForTimeout(300); // animation settle

      await expect(page).toHaveScreenshot('mobile-nav-open.png', {
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

// Dark mode variants for homepage
test.describe('Visual regression — Dark mode', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('homepage dark mode @ desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle theme
    const themeButton = page.getByRole('button', { name: /toggle theme|dark mode|light mode/i });
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot('homepage-dark-desktop.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    }
  });
});

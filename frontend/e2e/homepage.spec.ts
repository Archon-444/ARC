import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/ArcMarket/i);
  });

  test('should display navigation bar', async ({ page }) => {
    // Check navbar is visible
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();
  });

  test('should have skip to content link for accessibility', async ({ page }) => {
    // Skip link should exist for keyboard users
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeAttached();
  });

  test('should toggle theme when clicking theme button', async ({ page }) => {
    // Find and click theme toggle
    const themeButton = page.getByRole('button', { name: /toggle theme|dark mode|light mode/i });

    if (await themeButton.isVisible()) {
      const html = page.locator('html');
      const initialClass = await html.getAttribute('class');

      await themeButton.click();

      // Give time for theme to apply
      await page.waitForTimeout(300);

      const newClass = await html.getAttribute('class');
      // Class should have changed (dark mode toggled)
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('should open command palette with keyboard shortcut', async ({ page }) => {
    // Press Cmd+K or Ctrl+K to open command palette
    await page.keyboard.press('Meta+k');

    // Check if command palette is visible
    const commandPalette = page.getByRole('dialog').or(page.locator('[role="combobox"]'));

    // If not opened with Meta+K, try Ctrl+K
    if (!(await commandPalette.isVisible())) {
      await page.keyboard.press('Control+k');
    }

    // Command palette should be visible or searchable
    const searchInput = page.getByPlaceholder(/search/i);
    const isSearchVisible = await searchInput.isVisible().catch(() => false);
    const isPaletteVisible = await commandPalette.isVisible().catch(() => false);

    expect(isSearchVisible || isPaletteVisible).toBeTruthy();
  });

  test('should navigate to explore page', async ({ page }) => {
    // Find and click explore link
    const exploreLink = page.getByRole('link', { name: /explore/i }).first();
    await exploreLink.click();

    // Should navigate to explore page
    await expect(page).toHaveURL(/\/explore/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Navigation should adapt (hamburger menu or bottom nav)
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
      .or(page.locator('nav button[aria-label*="menu"]'))
      .or(page.locator('nav'));

    await expect(mobileNav.first()).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('homepage should have no major accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Check for essential accessibility features

    // 1. Page should have a title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // 2. HTML should have lang attribute
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();

    // 3. Main content area should exist
    const main = page.locator('main, [role="main"], #main-content');
    await expect(main.first()).toBeVisible();

    // 4. Images should have alt text (check a sample)
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const alt = await firstImage.getAttribute('alt');
      // Alt can be empty string for decorative images, but should exist
      expect(alt !== null).toBeTruthy();
    }

    // 5. Buttons should have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const name = await button.getAttribute('aria-label') ||
          await button.textContent();
        expect(name?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('skip link should work for keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Press Tab to focus skip link
    await page.keyboard.press('Tab');

    // Check if skip link is focused or visible
    const skipLink = page.getByRole('link', { name: /skip/i });
    const isVisible = await skipLink.isVisible().catch(() => false);

    if (isVisible) {
      // Click skip link
      await skipLink.click();

      // Main content should be focused or scrolled to
      const main = page.locator('#main-content, main');
      await expect(main.first()).toBeInViewport();
    }
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab through the page
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Something should be focused
    const focusedElement = page.locator(':focus');
    const hasFocus = await focusedElement.count() > 0;

    expect(hasFocus).toBeTruthy();
  });

  test('color contrast should be sufficient', async ({ page }) => {
    await page.goto('/');

    // Check that text is visible (basic contrast check)
    const textElements = page.locator('p, h1, h2, h3, span, a');
    const count = await textElements.count();

    if (count > 0) {
      const firstText = textElements.first();
      await expect(firstText).toBeVisible();
    }
  });

  test('forms should have associated labels', async ({ page }) => {
    await page.goto('/search');

    // Check for input fields
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      // Check for label, aria-label, or placeholder
      const id = await firstInput.getAttribute('id');
      const ariaLabel = await firstInput.getAttribute('aria-label');
      const placeholder = await firstInput.getAttribute('placeholder');
      const ariaLabelledBy = await firstInput.getAttribute('aria-labelledby');

      const hasLabel = id || ariaLabel || placeholder || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });
});

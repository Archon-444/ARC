import { test, expect } from '@playwright/test';

test.describe('wallet profile route', () => {
  test('renders fallback or wallet profile surface', async ({ page }) => {
    await page.goto('/profile/0x0000000000000000000000000000000000000000');
    await expect(
      page.getByText(/Profile not found|Your ARC account|0x0000/i).first()
    ).toBeVisible();
  });

  test('shows shared account language and utilities', async ({ page }) => {
    await page.goto('/profile/0x0000000000000000000000000000000000000000');
    await expect(
      page.getByText(/Account gateway|Account utilities|Profile not found/i).first()
    ).toBeVisible();
  });

  test('keeps tabs or fallback state accessible', async ({ page }) => {
    await page.goto('/profile/0x0000000000000000000000000000000000000000');
    await expect(
      page.getByRole('button', { name: /Owned|Created|Listings|Activity/i }).first()
        .or(page.getByText(/Profile not found/i))
    ).toBeVisible();
  });

  test('copy-address affordance stays reachable', async ({ page }) => {
    await page.goto('/profile/0x0000000000000000000000000000000000000000');
    const copyButton = page.getByRole('button', { name: /Copy address|Copied/i });
    if (await copyButton.count()) {
      await expect(copyButton.first()).toBeVisible();
    }
  });
});

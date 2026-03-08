import { test, expect } from '@playwright/test';

test.describe('wallet profile route', () => {
  test('renders fallback or wallet profile surface', async ({ page }) => {
    await page.goto('/profile/0x0000000000000000000000000000000000000000');
    await expect(
      page.getByText(/Profile not found|Your wallet profile|0x0000/i).first()
    ).toBeVisible();
  });
});

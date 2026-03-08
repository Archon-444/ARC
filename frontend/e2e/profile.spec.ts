import { test, expect } from '@playwright/test';

test.describe('profile gateway', () => {
  test('renders the account gateway shell', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('profile-gateway-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your ARC account' })).toBeVisible();
    await expect(page.getByTestId('profile-gateway-primary-cta')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('profile gateway', () => {
  test('renders the account gateway shell', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByTestId('profile-gateway-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your ARC account' })).toBeVisible();
  });

  test('shows connect CTA or open-profile handoff', async ({ page }) => {
    await page.goto('/profile');

    await expect(
      page.getByTestId('profile-connect-cta').or(page.getByTestId('profile-open-handoff'))
    ).toBeVisible();
  });

  test('shows structured loading skeleton without flash redirect', async ({ page }) => {
    await page.goto('/profile');
    await expect(
      page.getByTestId('profile-gateway-page').or(page.getByTestId('profile-gateway-skeleton'))
    ).toBeVisible();
    await expect(page).toHaveURL(/\/profile$/);
  });

  test('keeps utility actions visible', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText(/Account utilities/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Rewards/i }).or(page.getByRole('button', { name: /Rewards/i }))).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i }).or(page.getByRole('button', { name: /Settings/i }))).toBeVisible();
  });

  test('mobile preserves CTA hierarchy', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Your ARC account' })).toBeVisible();
    await expect(
      page.getByTestId('profile-connect-cta').or(page.getByTestId('profile-open-handoff'))
    ).toBeVisible();
  });
});

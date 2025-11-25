# E2E Tests

End-to-end tests using [Playwright](https://playwright.dev/).

## Running Tests

### Prerequisites

Install Playwright browsers:
```bash
npx playwright install
```

### Run Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test homepage

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# View test report
npm run test:e2e:report
```

### Test Structure

```
e2e/
├── homepage.spec.ts      # Homepage tests
├── navigation.spec.ts    # Navigation and routing tests
├── search.spec.ts        # Search functionality tests
├── explore.spec.ts       # Explore page tests
├── accessibility.spec.ts # Accessibility tests
├── pwa.spec.ts          # PWA and SEO tests
└── README.md            # This file
```

## Test Categories

### Homepage (`homepage.spec.ts`)
- Page loading
- Navigation bar visibility
- Theme toggle
- Command palette (Cmd+K)
- Mobile responsiveness

### Navigation (`navigation.spec.ts`)
- Route navigation
- 404 handling
- Browser history (back/forward)
- Mobile navigation

### Search (`search.spec.ts`)
- Search page functionality
- Search input behavior
- Command palette search

### Explore (`explore.spec.ts`)
- Page loading
- NFT grid display
- Filter options
- Sort functionality

### Accessibility (`accessibility.spec.ts`)
- Page title and lang attribute
- Skip links
- Keyboard navigation
- Form labels
- Color contrast

### PWA & SEO (`pwa.spec.ts`)
- Manifest validation
- Service worker
- Robots.txt and sitemap
- Meta tags
- Performance metrics

## CI Configuration

For GitHub Actions, create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
        working-directory: frontend
      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: frontend
      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: frontend
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## Writing New Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector');

    // Act
    await element.click();

    // Assert
    await expect(element).toBeVisible();
  });
});
```

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Keep tests independent** - each test should work in isolation
3. **Use page objects** for complex pages with many interactions
4. **Test user flows** rather than implementation details
5. **Handle flaky tests** with proper waits and retries

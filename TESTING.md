# Testing Guide

Comprehensive testing documentation for ARC Marketplace covering frontend, smart contracts, and end-to-end testing.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Frontend Testing](#frontend-testing)
- [Smart Contract Testing](#smart-contract-testing)
- [Testing Best Practices](#testing-best-practices)
- [Coverage Goals](#coverage-goals)

---

## Testing Philosophy

### Core Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Write tests first** - TDD when possible
3. **Keep tests simple** - One assertion per test when possible
4. **Make tests readable** - Clear test names and structure
5. **Test edge cases** - Don't just test the happy path

### Testing Pyramid

```
        /\
       /E2E\         ← Few (End-to-End tests)
      /------\
     /  INT  \       ← Some (Integration tests)
    /----------\
   /   UNIT    \     ← Many (Unit tests)
  /--------------\
```

---

## Frontend Testing

### Setup

Testing infrastructure is already configured with:
- **Jest** - Test runner
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - Custom matchers

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test NFTCard.test.tsx

# Run tests matching a pattern
npm test -- --grep "renders"
```

### Test File Structure

```
src/
├── components/
│   └── nft/
│       ├── NFTCard.tsx
│       └── __tests__/
│           └── NFTCard.test.tsx
```

### Writing Component Tests

#### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders with required props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

#### Testing User Interactions

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Testing Async Behavior

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { DataLoader } from '../DataLoader';

describe('DataLoader', () => {
  it('displays data after loading', async () => {
    render(<DataLoader />);

    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument();
    });
  });
});
```

#### Testing with Mocks

```typescript
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));

// Mock API calls
jest.mock('@/lib/api', () => ({
  fetchNFTs: jest.fn().mockResolvedValue([
    { id: '1', name: 'Test NFT' }
  ]),
}));
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Accessibility Testing

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('MyComponent Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Smart Contract Testing

### Setup

Smart contract tests use:
- **Hardhat** - Ethereum development environment
- **Ethers.js** - Blockchain interaction
- **Mocha/Chai** - Test framework

### Running Contract Tests

```bash
cd contracts

# Run all tests
npm test

# Run specific test file
npx hardhat test test/NFTMarketplace.test.js

# Run with gas reporting
REPORT_GAS=true npm test

# Run with coverage
npm run coverage
```

### Writing Contract Tests

#### Basic Contract Test

```javascript
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('NFTMarketplace', function () {
  let marketplace;
  let owner, buyer;

  beforeEach(async function () {
    [owner, buyer] = await ethers.getSigners();

    const Marketplace = await ethers.getContractFactory('NFTMarketplace');
    marketplace = await Marketplace.deploy();
    await marketplace.deployed();
  });

  it('should list an NFT', async function () {
    const price = ethers.utils.parseUnits('100', 6); // 100 USDC

    await marketplace.listItem(nftAddress, tokenId, price);

    const listing = await marketplace.getListing(nftAddress, tokenId);
    expect(listing.price).to.equal(price);
  });
});
```

#### Testing Events

```javascript
it('emits ItemListed event', async function () {
  const price = ethers.utils.parseUnits('100', 6);

  await expect(marketplace.listItem(nftAddress, tokenId, price))
    .to.emit(marketplace, 'ItemListed')
    .withArgs(nftAddress, tokenId, owner.address, price);
});
```

#### Testing Reverts

```javascript
it('reverts when price is zero', async function () {
  await expect(
    marketplace.listItem(nftAddress, tokenId, 0)
  ).to.be.revertedWith('Price must be greater than zero');
});
```

#### Testing Access Control

```javascript
it('only seller can cancel listing', async function () {
  await marketplace.connect(owner).listItem(nftAddress, tokenId, price);

  await expect(
    marketplace.connect(buyer).cancelListing(nftAddress, tokenId)
  ).to.be.revertedWith('Not the seller');
});
```

#### Testing Complex Scenarios

```javascript
describe('Auction Flow', function () {
  it('completes full auction lifecycle', async function () {
    // 1. Create auction
    await marketplace.createAuction(
      nftAddress,
      tokenId,
      minBid,
      startTime,
      endTime
    );

    // 2. Place bids
    await marketplace.connect(bidder1).placeBid(nftAddress, tokenId, bid1);
    await marketplace.connect(bidder2).placeBid(nftAddress, tokenId, bid2);

    // 3. Fast forward time
    await ethers.provider.send('evm_increaseTime', [86400]); // 1 day
    await ethers.provider.send('evm_mine');

    // 4. Settle auction
    await marketplace.settleAuction(nftAddress, tokenId);

    // 5. Verify outcome
    const newOwner = await nft.ownerOf(tokenId);
    expect(newOwner).to.equal(bidder2.address);
  });
});
```

---

## Testing Best Practices

### General Guidelines

#### DO ✅

- **Test user-facing behavior**
  ```typescript
  // Good
  expect(screen.getByText('Buy Now')).toBeInTheDocument();

  // Bad
  expect(component.state.isLoading).toBe(false);
  ```

- **Use descriptive test names**
  ```typescript
  // Good
  it('displays error message when API call fails', () => {});

  // Bad
  it('works', () => {});
  ```

- **Arrange, Act, Assert pattern**
  ```typescript
  it('increments counter', () => {
    // Arrange
    const { result } = renderHook(() => useCounter());

    // Act
    act(() => result.current.increment());

    // Assert
    expect(result.current.count).toBe(1);
  });
  ```

- **Test edge cases**
  ```typescript
  describe('formatPrice', () => {
    it('handles zero', () => {
      expect(formatPrice(0)).toBe('0 USDC');
    });

    it('handles very large numbers', () => {
      expect(formatPrice(1e18)).toBe('1,000,000,000,000 USDC');
    });

    it('handles decimals', () => {
      expect(formatPrice(12.345)).toBe('12.35 USDC');
    });
  });
  ```

#### DON'T ❌

- **Don't test implementation details**
  ```typescript
  // Bad
  expect(component.find('.internal-class')).toExist();

  // Good
  expect(screen.getByRole('button')).toBeVisible();
  ```

- **Don't make tests depend on each other**
  ```typescript
  // Bad
  let sharedState;
  it('test 1', () => { sharedState = 'value'; });
  it('test 2', () => { expect(sharedState).toBe('value'); });

  // Good
  it('test 1', () => {
    const state = 'value';
    expect(state).toBe('value');
  });
  ```

- **Don't skip cleanup**
  ```typescript
  // Good
  afterEach(() => {
    jest.clearAllMocks();
  });
  ```

### Mocking Guidelines

#### When to Mock

- External API calls
- Browser APIs (localStorage, etc.)
- Time-dependent code
- Heavy computations
- Third-party libraries

#### Mock Examples

```typescript
// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'test' }),
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Date
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));

// Restore after test
afterEach(() => {
  jest.useRealTimers();
});
```

---

## Coverage Goals

### Target Metrics

| Type | Target | Current |
|------|--------|---------|
| Statements | 80% | 50% |
| Branches | 75% | 45% |
| Functions | 80% | 50% |
| Lines | 80% | 50% |

### Checking Coverage

```bash
# Frontend
cd frontend
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html

# Contracts
cd contracts
npm run coverage
```

### Coverage Reports

Coverage reports show:
- **Green** - Well tested (>80%)
- **Yellow** - Needs improvement (50-80%)
- **Red** - Insufficient (<50%)

### Improving Coverage

Focus on:
1. Critical user paths
2. Error handling
3. Edge cases
4. Complex business logic
5. Security-sensitive code

---

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Push to main/develop
- Scheduled (daily)

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Frontend tests
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm test

      # Contract tests
      - name: Contract Tests
        run: |
          cd contracts
          npm install
          npm test
```

---

## Debugging Tests

### Common Issues

#### Test timeouts
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

#### Async issues
```typescript
// Use waitFor for async updates
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

#### State not updating
```typescript
// Wrap state changes in act()
act(() => {
  result.current.updateState();
});
```

### Debug Commands

```bash
# Run single test in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand MyTest

# Enable verbose output
npm test -- --verbose

# Show console.log output
npm test -- --silent=false
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Hardhat Testing](https://hardhat.org/tutorial/testing-contracts)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Questions?

- Check existing tests for examples
- Ask in GitHub issues
- Review [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Happy Testing! 🧪**

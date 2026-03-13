# Contributing to ARC Marketplace

Thank you for your interest in contributing to ARC Marketplace! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome constructive feedback
- Focus on what is best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Unprofessional conduct

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A wallet with Arc testnet funds (for testing)
- Basic knowledge of:
  - React/Next.js
  - TypeScript
  - Solidity (for smart contract work)
  - Tailwind CSS

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/ARC.git
   cd ARC
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Archon-444/ARC.git
   ```

3. **Install dependencies**
   ```bash
   # Install contract dependencies
   cd contracts
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # In contracts/
   cp .env.example .env
   # Edit .env with your private key

   # In frontend/
   cp .env.example .env.local
   # Edit .env.local with contract addresses
   ```

5. **Run development environment**
   ```bash
   # Terminal 1: Start Hardhat node (optional for local testing)
   cd contracts
   npx hardhat node

   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Branch

```bash
# Update your local repository
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write code** following our [Code Style](#code-style)
2. **Write tests** for new functionality
3. **Run tests** to ensure nothing breaks
4. **Update documentation** if needed

### Before Committing

```bash
# Format code
cd frontend
npm run format

# Check types
npm run type-check

# Run linter
npm run lint:fix

# Run tests
npm test

# Build to check for errors
npm run build
```

---

## Code Style

### TypeScript/React

- Use **TypeScript** for all new files
- Use **functional components** with hooks
- Follow **React best practices**:
  - Small, focused components
  - Proper prop typing
  - Meaningful component and variable names

#### Example Component

```typescript
/**
 * Component description
 */
interface ComponentProps {
  /** Prop description */
  name: string;
  /** Optional prop */
  optional?: boolean;
}

export function Component({ name, optional = false }: ComponentProps) {
  // Implementation
  return (
    <div className="card">
      <h2>{name}</h2>
    </div>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`NFTCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMarketplace.ts`)
- **Utilities**: camelCase (`formatPrice.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PRICE`)
- **CSS Classes**: kebab-case or use Tailwind utilities

### CSS/Styling

- **Prefer Tailwind** utilities over custom CSS
- Use **design tokens** from `globals.css`:
  ```tsx
  // Good
  <div className="bg-[var(--color-surface)]" />

  // Also good (Tailwind utility)
  <div className="bg-white dark:bg-neutral-800" />
  ```

- Use **semantic class names** when needed:
  ```css
  /* Good */
  .card-hover { ... }

  /* Bad */
  .blue-box { ... }
  ```

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use `0.8.24` compiler version
- Include NatSpec comments:
  ```solidity
  /**
   * @notice Lists an NFT for sale
   * @param collection The NFT contract address
   * @param tokenId The token ID to list
   * @param price The listing price in USDC (6 decimals)
   */
  function listItem(address collection, uint256 tokenId, uint256 price) external {
      // Implementation
  }
  ```

---

## Testing Guidelines

See [TESTING.md](./TESTING.md) for comprehensive testing guidelines.

### Quick Reference

```bash
# Frontend tests
cd frontend
npm test                  # Run tests once
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage

# Contract tests
cd contracts
npm test                  # Run all contract tests
npx hardhat test --grep "NFTMarketplace"  # Run specific tests
```

### Test Requirements

- **Unit tests** for all new components
- **Integration tests** for complex features
- **Contract tests** for all smart contract functions
- Minimum **80% code coverage** for new code

---

## Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Good
git commit -m "feat(marketplace): add bulk listing functionality"
git commit -m "fix(nftcard): resolve image loading issue"
git commit -m "docs(readme): update installation instructions"

# Bad
git commit -m "fixed stuff"
git commit -m "WIP"
```

### Detailed Example

```
feat(search): implement Algolia search integration

- Add SearchModal component
- Integrate Algolia client
- Add search shortcuts (cmd+K)
- Update navbar with search trigger

Closes #123
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Update documentation**
   - Update README if adding features
   - Add/update JSDoc comments
   - Update CHANGELOG (if exists)

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR on GitHub**
   - Use descriptive title
   - Fill out PR template
   - Link related issues
   - Add screenshots (for UI changes)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. **Automated checks** must pass:
   - TypeScript compilation
   - Linting
   - Tests
   - Build

2. **Code review** by maintainers:
   - Code quality
   - Test coverage
   - Documentation
   - Security considerations

3. **Approval** required before merge

4. **Squash and merge** preferred

---

## Project Structure

```
ARC/
├── contracts/               # Smart contracts (Solidity, Hardhat)
│   ├── contracts/
│   │   ├── ArcMarketplace.sol
│   │   ├── FeeVault.sol
│   │   ├── ArcTokenFactory.sol
│   │   ├── ArcBondingCurveAMM.sol
│   │   └── ...
│   ├── test/
│   └── scripts/
│
├── frontend/               # Next.js (App Router)
│   ├── src/
│   │   ├── app/           # Pages: launch, token/[address], explore, ...
│   │   ├── components/    # ui/, nft/, token/ (TokenCard, LauncherTokenCard), explore/, home/
│   │   ├── hooks/         # useTokenFactory, useTokenAMM, useTokenActivity, useSubgraphQueries, ...
│   │   ├── lib/           # graphql-client, contracts, utils
│   │   └── services/      # api, websocket (subscribeToToken)
│   └── e2e/
│
├── backend/                # Express REST + WebSocket
│   ├── src/               # routes (activity, including token), websocket (token + NFT rooms)
│   └── TOKEN_ACTIVITY_BROADCAST.md
│
├── subgraph/              # The Graph (marketplace + token launcher)
│   ├── schema.graphql     # LaunchedToken, TokenTrade, TokenGraduation, ...
│   ├── DEPLOY.md          # Set ArcTokenFactory address before deploy
│   └── src/               # arc-token-factory.ts, arc-bonding-curve-amm.ts, ...
│
└── *.md                   # README, CLAUDE, GAP_ANALYSIS, SECURITY_AUDIT, etc.
```

### Key Directories

- **`components/ui/`** - Reusable UI (Button, Card, etc.)
- **`components/nft/`** - NFTCard, NFTGrid
- **`components/token/`** - TokenCard, LauncherTokenCard, LauncherTokenGrid
- **`hooks/`** - useTokenActivity, useLaunchedTokensQuery, useTokenConfig, useTokenAMM
- **`lib/`** - graphql-client (fetchLaunchedTokens), contracts, utils
- **`app/launch/`** - Token launch page; **`app/token/[address]/`** - Token market page

---

## Component Guidelines

### Creating a New Component

1. **Create component file**
   ```tsx
   // src/components/ui/NewComponent.tsx
   'use client'; // If using client-side features

   interface NewComponentProps {
     // Props
   }

   export function NewComponent({ }: NewComponentProps) {
     // Implementation
   }
   ```

2. **Add tests**
   ```tsx
   // src/components/ui/__tests__/NewComponent.test.tsx
   import { render, screen } from '@testing-library/react';
   import { NewComponent } from '../NewComponent';

   describe('NewComponent', () => {
     it('renders correctly', () => {
       // Test
     });
   });
   ```

3. **Export from index** (if applicable)
   ```tsx
   // src/components/ui/index.ts
   export { NewComponent } from './NewComponent';
   ```

### Component Best Practices

- **Keep components small** - Single responsibility
- **Use TypeScript** - Type all props
- **Add JSDoc comments** - Document complex logic
- **Handle loading states** - Use Skeleton components
- **Handle errors** - Use EmptyState components
- **Make accessible** - Add ARIA labels, keyboard support
- **Make responsive** - Mobile-first design

---

## Questions?

- **GitHub Issues** - [Open an issue](https://github.com/Archon-444/ARC/issues)
- **Documentation** - Check `docs/` folder
- **Code Examples** - Look at existing components

---

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to ARC Marketplace! 🚀**

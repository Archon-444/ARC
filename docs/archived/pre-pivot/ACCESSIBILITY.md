# Accessibility Guidelines

Making ARC Marketplace accessible to all users, including those with disabilities.

## Table of Contents

- [Our Commitment](#our-commitment)
- [WCAG Compliance](#wcag-compliance)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Color and Contrast](#color-and-contrast)
- [Component Guidelines](#component-guidelines)
- [Testing for Accessibility](#testing-for-accessibility)
- [Resources](#resources)

---

## Our Commitment

We are committed to making ARC Marketplace accessible to everyone, regardless of ability. This includes users who:

- Use screen readers
- Navigate by keyboard only
- Have visual impairments (color blindness, low vision)
- Have motor disabilities
- Use assistive technologies

**Goal: WCAG 2.1 Level AA compliance**

---

## WCAG Compliance

### WCAG 2.1 Principles (POUR)

#### 1. Perceivable
Information and UI components must be presentable to users in ways they can perceive.

- **Text alternatives** for non-text content
- **Captions** for audio/video
- **Adaptable** content that can be presented in different ways
- **Distinguishable** content that's easy to see and hear

#### 2. Operable
UI components and navigation must be operable.

- **Keyboard accessible** - All functionality available via keyboard
- **Enough time** - Users have enough time to read and use content
- **Seizures** - No content that causes seizures
- **Navigable** - Ways to help users navigate and find content

#### 3. Understandable
Information and operation of UI must be understandable.

- **Readable** - Text content is readable and understandable
- **Predictable** - Web pages appear and operate in predictable ways
- **Input assistance** - Help users avoid and correct mistakes

#### 4. Robust
Content must be robust enough for interpretation by assistive technologies.

- **Compatible** - Maximize compatibility with current and future tools

---

## Keyboard Navigation

### Essential Keyboard Support

All interactive elements must be keyboard accessible:

```
Tab          → Move focus forward
Shift + Tab  → Move focus backward
Enter/Space  → Activate buttons/links
Escape       → Close modals/menus
Arrow keys   → Navigate lists/menus
```

### Implementation

#### Focus Management

```typescript
// ✅ Good: Visible focus indicator
<button className="focus:ring-2 focus:ring-primary-500 focus:outline-none">
  Click me
</button>

// ❌ Bad: No focus indicator
<button className="outline-none">
  Click me
</button>
```

#### Focus Trapping in Modals

```typescript
import { useEffect, useRef } from 'react';

export function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save currently focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first interactive element in modal
    const firstFocusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();

    // Restore focus on close
    return () => {
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  // Trap tab key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }

    if (e.key === 'Tab') {
      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
```

#### Skip Links

```typescript
// Add to layout.tsx
export function Layout({ children }) {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav>{/* Navigation */}</nav>
      <main id="main-content">{children}</main>
    </>
  );
}
```

```css
/* In globals.css */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  padding: 1rem;
  background: var(--color-primary-500);
  color: white;
  font-weight: bold;
  z-index: 1000;
}

.skip-link:focus {
  left: 0;
}
```

---

## Screen Reader Support

### ARIA Labels

```typescript
// ✅ Good: Descriptive labels
<button aria-label="Add to favorites">
  <Heart />
</button>

<input
  type="search"
  aria-label="Search NFTs and collections"
  placeholder="Search..."
/>

// ❌ Bad: No label for icon-only button
<button>
  <Heart />
</button>
```

### ARIA Roles

```typescript
// Navigation
<nav role="navigation" aria-label="Main navigation">
  {/* Links */}
</nav>

// Search
<div role="search">
  <input type="search" />
</div>

// List
<div role="list">
  <div role="listitem">Item 1</div>
  <div role="listitem">Item 2</div>
</div>

// Alert
<div role="alert" aria-live="polite">
  NFT purchased successfully!
</div>
```

### Live Regions

```typescript
// Announce dynamic changes
<div aria-live="polite" aria-atomic="true">
  {loading ? 'Loading NFTs...' : `${nfts.length} NFTs loaded`}
</div>

// For urgent updates
<div aria-live="assertive" role="alert">
  Error: Transaction failed
</div>
```

### Accessible Forms

```typescript
export function AccessibleForm() {
  return (
    <form>
      {/* Proper label association */}
      <label htmlFor="nft-name">NFT Name</label>
      <input
        id="nft-name"
        type="text"
        aria-required="true"
        aria-invalid={hasError}
        aria-describedby={hasError ? 'name-error' : undefined}
      />
      {hasError && (
        <span id="name-error" role="alert">
          Name is required
        </span>
      )}

      {/* Fieldset for related inputs */}
      <fieldset>
        <legend>Listing Type</legend>
        <input type="radio" id="fixed" name="type" value="fixed" />
        <label htmlFor="fixed">Fixed Price</label>
        <input type="radio" id="auction" name="type" value="auction" />
        <label htmlFor="auction">Auction</label>
      </fieldset>
    </form>
  );
}
```

---

## Color and Contrast

### Contrast Requirements (WCAG AA)

- **Normal text**: 4.5:1 minimum
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum
- **UI components**: 3:1 minimum

### Our Color System

All colors in our design system meet WCAG AA standards:

```css
/* ✅ Good: High contrast */
:root {
  --color-text-primary: #111827;    /* On white: 16.5:1 */
  --color-text-secondary: #6B7280;  /* On white: 5.9:1 */
}

/* ✅ Good: Sufficient for large text */
.text-neutral-400 {
  color: #9CA3AF; /* On white: 3.4:1 - OK for large text */
}
```

### Color is Not the Only Indicator

```typescript
// ❌ Bad: Color only
<div className="text-red-500">Error</div>

// ✅ Good: Color + icon + text
<div className="flex items-center gap-2 text-red-500" role="alert">
  <AlertCircle aria-hidden="true" />
  <span>Error: Transaction failed</span>
</div>
```

### Testing Contrast

Use browser DevTools or online tools:
- Chrome DevTools (Inspect → Accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colorable](https://colorable.jxnblk.com/)

---

## Component Guidelines

### Buttons

```typescript
// ✅ Accessible button
<button
  type="button"
  aria-label="Close modal"
  onClick={handleClose}
  className="focus:ring-2 focus:ring-primary-500"
>
  <X aria-hidden="true" />
</button>

// Interactive elements should be <button> not <div>
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

### Links

```typescript
// ✅ Descriptive link text
<Link href="/nft/123">
  View "Cosmic Cat #42" details
</Link>

// ❌ Bad: Generic text
<Link href="/nft/123">
  Click here
</Link>

// External links
<a
  href="https://external.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="External link (opens in new tab)"
>
  Visit site
  <ExternalLink aria-hidden="true" />
</a>
```

### Images

```typescript
// Decorative images
<Image src="/decoration.png" alt="" aria-hidden="true" />

// Informative images
<Image
  src="/nft.png"
  alt="Cosmic Cat #42 - a colorful cat in space wearing an astronaut helmet"
/>

// NFT images with fallback
<Image
  src={nft.image}
  alt={nft.name || `NFT #${nft.tokenId} from ${collection.name}`}
  onError={() => setImageError(true)}
/>
```

### Modals/Dialogs

```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Purchase</h2>
  <p id="modal-description">
    Are you sure you want to buy this NFT for 100 USDC?
  </p>
  <button onClick={onConfirm}>Confirm</button>
  <button onClick={onCancel}>Cancel</button>
</div>
```

### Dropdowns/Menus

```typescript
<button
  aria-expanded={isOpen}
  aria-haspopup="true"
  aria-controls="menu"
  onClick={toggle}
>
  Options
</button>

{isOpen && (
  <ul id="menu" role="menu">
    <li role="menuitem">
      <button onClick={handleEdit}>Edit</button>
    </li>
    <li role="menuitem">
      <button onClick={handleDelete}>Delete</button>
    </li>
  </ul>
)}
```

### Tables

```typescript
<table>
  <caption>Recent NFT Sales</caption>
  <thead>
    <tr>
      <th scope="col">NFT</th>
      <th scope="col">Price</th>
      <th scope="col">Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Cosmic Cat #42</th>
      <td>100 USDC</td>
      <td>2024-01-15</td>
    </tr>
  </tbody>
</table>
```

---

## Testing for Accessibility

### Automated Testing

```bash
# Install axe-core
npm install --save-dev @axe-core/react jest-axe

# Run automated tests
npm test
```

```typescript
// In tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should not have violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing

#### Keyboard Testing
1. Unplug your mouse
2. Navigate using only keyboard
3. Verify all features are accessible
4. Check focus indicators are visible

#### Screen Reader Testing
- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (free) or JAWS
- **Chrome**: ChromeVox extension

#### Browser DevTools
1. Open DevTools
2. Go to Lighthouse tab
3. Run Accessibility audit
4. Fix reported issues

### Accessibility Checklist

- [ ] All images have alt text
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA
- [ ] Forms have proper labels
- [ ] ARIA labels on icon-only buttons
- [ ] Skip link implemented
- [ ] Modal focus trapping works
- [ ] Screen reader tested
- [ ] Keyboard navigation tested
- [ ] No accessibility violations in axe

---

## Common Pitfalls

### ❌ Don't

```typescript
// Don't use divs as buttons
<div onClick={handleClick}>Click me</div>

// Don't remove focus indicators
button { outline: none; } // Bad

// Don't use placeholder as label
<input placeholder="Email" /> // Bad

// Don't use low contrast colors
<p className="text-gray-300">Important text</p> // Too light

// Don't hide content from screen readers incorrectly
<span style={{ display: 'none' }}>Hidden</span> // Bad
```

### ✅ Do

```typescript
// Use semantic HTML
<button onClick={handleClick}>Click me</button>

// Custom focus indicators
button:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

// Proper label + placeholder
<label htmlFor="email">Email</label>
<input id="email" placeholder="john@example.com" />

// Use accessible colors
<p className="text-gray-900">Important text</p>

// Hide from screen readers properly
<span aria-hidden="true">Decorative icon</span>
```

---

## Resources

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluator
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/) - W3C patterns

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

### Testing Tools

- [Pa11y](https://pa11y.org/) - Automated testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome DevTools
- [Screen Reader Emulator](https://chrome.google.com/webstore/detail/screen-reader/kgejglhpjiefppelpmljglcjbhoiplfn)

---

## Support

Users with accessibility needs can:
- Report issues via GitHub
- Contact support (when available)
- Request specific accommodations

---

## Continuous Improvement

Accessibility is an ongoing process:

1. **Regular audits** - Quarterly accessibility reviews
2. **User testing** - Test with users who use assistive tech
3. **Stay updated** - Follow WCAG updates
4. **Team training** - Ensure all developers understand a11y

---

**Building for everyone. 🌐♿**

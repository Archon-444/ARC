import { applySlippageMinOut, safeHttpUrl } from '../utils';

describe('safeHttpUrl', () => {
  it('allows http and https URLs', () => {
    expect(safeHttpUrl('https://example.com')).toBe('https://example.com/');
    expect(safeHttpUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('prefixes scheme-less hosts with https', () => {
    expect(safeHttpUrl('example.com')).toBe('https://example.com/');
  });

  it('rejects javascript and data URLs', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('data:text/html,hi')).toBeNull();
    expect(safeHttpUrl('vbscript:msgbox(1)')).toBeNull();
  });

  it('returns null for empty values', () => {
    expect(safeHttpUrl('')).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
    expect(safeHttpUrl('   ')).toBeNull();
  });
});

describe('applySlippageMinOut', () => {
  it('applies a 1% floor by default', () => {
    expect(applySlippageMinOut(10000n)).toBe(9900n);
  });

  it('returns 0 for missing or zero amounts', () => {
    expect(applySlippageMinOut(undefined)).toBe(0n);
    expect(applySlippageMinOut(0n)).toBe(0n);
  });
});

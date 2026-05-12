/**
 * Minimal ambient declarations for viem so paid-smoke.ts type-checks
 * without viem installed. Delete this stub once `npm install` from the
 * repo root resolves viem in apps/trust-api/node_modules.
 */

declare module 'viem' {
  // Intentionally left empty — paid-smoke only uses viem via dynamic
  // import for its side effects, but the import call itself must
  // resolve a type. Real shape is provided by viem at runtime.
  const viem: any;
  export = viem;
}

declare module 'viem/accounts' {
  export function privateKeyToAccount(privateKey: `0x${string}`): {
    address: `0x${string}`;
    signTypedData(args: any): Promise<`0x${string}`>;
  };
}

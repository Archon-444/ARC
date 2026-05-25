import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**'],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // W11.3 / W16.3 boundary rule: legacy-primitives/ is the
      // quarantined pre-pivot surface. Trust-layer code in apps/* and
      // packages/* must not import from it. Verified by the
      // `lint:boundary-fixture` root script, which runs eslint
      // against apps/web/__lint_fixture__/should-fail.ts and asserts
      // a non-zero exit. CI runs the same assertion in the lint job.
      // See docs/ci-boundary-rule.md.
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/legacy-primitives/**', 'legacy-primitives/**'],
          message: 'legacy-primitives/ is quarantined frozen surface. Do not import from apps/* or packages/*. If you need a primitive, expose it through an @arc/* adapter and import the adapter. See STRATEGIC_PIVOT.md and legacy-primitives/README.md.',
        }],
      }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['src/app/api/**/*.ts', 'src/lib/**/*.ts', 'src/services/**/*.ts', 'src/providers/**/*.tsx', 'src/hooks/**/*.ts', 'src/hooks/**/*.tsx'],
    rules: {
      'no-console': 'off',
    },
  },
];

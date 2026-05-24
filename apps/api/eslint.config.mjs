// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  // Use `recommended` instead of `recommendedTypeChecked` to avoid
  // false-positive "unsafe-*" errors that fire on NestJS DI patterns.
  // We then opt-in to only the type-aware rules that are truly useful.
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      // ── TypeScript ───────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'off',       // Allow `any` when needed
      '@typescript-eslint/no-unused-vars': [             // Warn, not error
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off', // Common in NestJS DTOs
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',

      // ── Async safety (keep — they catch real bugs) ────────────────────────
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',

      // ── Unsafe-* rules — too noisy with NestJS decorator/DI patterns ─────
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // ── General JS ───────────────────────────────────────────────────────
      'no-console': 'warn',                              // Use Logger instead
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);

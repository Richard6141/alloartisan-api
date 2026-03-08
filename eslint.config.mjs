// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'src/generated/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
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
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // ── Règles désactivées / assouplies (bruit sans valeur ajoutée) ──────────
      '@typescript-eslint/no-explicit-any': 'off',

      // Les types `any` issus de Prisma.$queryRaw, axios, SDK tiers sont inévitables
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Prisma $queryRaw templates sont typés any par design
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',

      // String templates avec Decimal ou types complexes Prisma
      '@typescript-eslint/restrict-template-expressions': 'off',

      // no-base-to-string : Prisma/JSON objects dans template literals
      '@typescript-eslint/no-base-to-string': 'warn',

      // ── Règles gardées en erreur (vraie valeur ajoutée) ──────────────────────
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/require-await': 'warn',
    },
  },
);

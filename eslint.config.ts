// eslint.config.ts
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
import tsParser from '@typescript-eslint/parser';
// Corrected import: globalIgnores is not from 'eslint/config', but directly from a flat config definition.
// It's usually a top-level property, not imported directly like a function.
// If you want a global ignore, it should be a separate object in the config array.
// For now, removing the import as it's not used like a function.
// import { globalIgnores } from 'eslint/config'; // This import is likely incorrect and not needed for its usage.

export default tseslint.config([
  // Global ignores should be an object at the top level of the array
  {
    ignores: ['dist', 'vite.config.ts'],
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      //'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      //...reactRefresh.configs.vite.rules,

      // --- Rules for unused-imports (often preferred over default ESLint/TS rules) ---
      // Disable default ESLint/TypeScript unused var rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Enable unused-imports plugin rules
      'unused-imports/no-unused-imports': 'error', // To detect unused imports
      'unused-imports/no-unused-vars': [         // To detect unused variables
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // --- End unused-imports config ---

      'no-control-regex': 'off', // Specific rule you want to disable
    },
  },
]);
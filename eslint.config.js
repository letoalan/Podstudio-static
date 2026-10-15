import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  { ignores: ['dist/**', 'legacy/**', 'node_modules/**', 'dev-dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: { import: importPlugin },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // R3 : fonction de 40 lignes maximum
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      // R2 (filet de sécurité, le contrôle principal est scripts/check-lines.mjs)
      'max-lines': ['error', { max: 200 }],
      // R5 : aucune dépendance circulaire
      'import/no-cycle': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];

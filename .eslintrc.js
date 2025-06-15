export default {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'lit',
    'lit-a11y',
  ],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // Lit specific rules
    'lit/no-legacy-template-syntax': 'error',
    'lit/no-template-bind': 'error',
    'lit/no-useless-template-literals': 'error',
    'lit/attribute-value-entities': 'error',
    'lit/binding-positions': 'error',
    'lit/no-invalid-html': 'error',
    'lit/no-value-attribute': 'error',
    
    // Accessibility rules
    'lit-a11y/accessible-emoji': 'error',
    'lit-a11y/alt-text': 'error',
    'lit-a11y/anchor-has-content': 'error',
    'lit-a11y/anchor-is-valid': 'error',
    'lit-a11y/aria-attrs': 'error',
    'lit-a11y/aria-props': 'error',
    'lit-a11y/aria-role': 'error',
    'lit-a11y/aria-unsupported-elements': 'error',
    'lit-a11y/autocomplete-valid': 'error',
    'lit-a11y/click-events-have-key-events': 'error',
    'lit-a11y/heading-has-content': 'error',
    'lit-a11y/img-redundant-alt': 'error',
    'lit-a11y/interactive-supports-focus': 'error',
    'lit-a11y/label-has-associated-control': 'error',
    'lit-a11y/mouse-events-have-key-events': 'error',
    'lit-a11y/no-access-key': 'error',
    'lit-a11y/no-autofocus': 'error',
    'lit-a11y/no-distracting-elements': 'error',
    'lit-a11y/no-redundant-role': 'error',
    'lit-a11y/role-has-required-aria-props': 'error',
    'lit-a11y/role-supports-aria-props': 'error',
    'lit-a11y/tabindex-no-positive': 'error',
    'lit-a11y/valid-lang': 'error',
    
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.config.ts',
  ],
}; 
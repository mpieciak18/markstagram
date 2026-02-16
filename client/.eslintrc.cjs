module.exports = {
  root: true,
  env: { browser: true, es2024: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh', 'react', 'react-hooks', 'import'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 0,
    'react/no-unescaped-entities': 0,
    indent: ['error', 'tab'],
    quotes: ['error', 'single'],
    'linebreak-style': ['error', 'unix'],
    'comma-dangle': ['error', 'always-multiline'],
    semi: ['error', 'always'],
    'no-unused-vars': ['error'],
    'no-console': ['warn'],
    'no-control-regex': 0,
    'react/react-in-jsx-scope': 'off',
  },
  globals: {
    window: 'readonly',
    document: 'readonly',
  },
};

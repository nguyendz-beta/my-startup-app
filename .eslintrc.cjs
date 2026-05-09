module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  env: { node: true, es2021: true },
  overrides: [
    {
      files: ['frontend/**/*.ts', 'frontend/**/*.tsx', 'src/**/*.ts', 'src/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      settings: { react: { version: 'detect' } },
      rules: {},
    },
    {
      files: ['backend/**/*.ts', 'backend/**/*.tsx', 'src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {},
    },
  ],
};

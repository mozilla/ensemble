module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:jsx-a11y/recommended',
    ],
    parser: 'babel-eslint',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: [
        'json',
        'jsx-a11y',
        'react',
    ],
    root: true,
    rules: {
        // Errors
        'eqeqeq': 'error',
        'no-global-assign': 'error',
        'no-redeclare': ['error', {builtinGlobals: true}],
        'no-shadow': ['error', {builtinGlobals: true}],
        'no-var': 'error',
        'prefer-const': 'error',
        'semi': ['error', 'always'],

        // Warnings
        'prefer-arrow-callback': 'warn',
        'no-console': 'warn',

        // Plugins
        'jsx-a11y/label-has-for': ['error', {required: {every: ['id']}}],
        'jsx-a11y/no-onchange': 'off',
        'react/display-name': 'off',
        'react/prop-types': 'off',
        'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
    },
};

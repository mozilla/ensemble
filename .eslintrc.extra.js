module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true,
        'jest/globals': true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:jest/recommended',
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
        'jest',
    ],
    root: true,
    overrides: [
        {
            files: ['src/tests/jest/*.js'],

            // In src/setupTests.js, these globals are defined in such a way
            // that they are available to all Jest tests
            globals: {
                React: true,
                shallow: true,
            },
        },
    ],
    settings: {
        react: {
            version: "16.4.2",
        },
    },
    rules: {
        // Errors
        'eqeqeq': 'error',
        'no-global-assign': 'error',
        'no-redeclare': ['error', {builtinGlobals: true}],
        'no-shadow': ['error', {builtinGlobals: true}],
        'no-var': 'error',
        'prefer-const': 'error',
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'always-multiline'],

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

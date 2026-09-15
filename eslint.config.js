const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const vitest = require('@vitest/eslint-plugin');
const globals = require('globals');


module.exports = [
    { ignores: ['build'] },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        ...react.configs.flat.recommended,
        languageOptions: {
            ...react.configs.flat.recommended.languageOptions,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files: ['**/*.{js,jsx}'],
        ...jsxA11y.flatConfigs.recommended,
    },
    {
        files: ['**/*.{js,jsx}'],
        rules: {
            // Errors
            'eqeqeq': 'error',
            'no-global-assign': 'error',
            'no-redeclare': ['error', { builtinGlobals: true }],
            'no-shadow': ['error', { builtinGlobals: true }],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-console': 'error',

            // Stylistic warnings
            'semi': ['warn', 'always'],
            'comma-dangle': ['warn', {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never',
            }],
            'prefer-arrow-callback': 'warn',

            // Plugins
            'jsx-a11y/no-onchange': 'off',
            'react/display-name': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
        },
    },
    {
        files: ['src/tests/jest/**/*.test.jsx'],
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.vitest,
                // In src/setupTests.js, these globals are defined in such a way
                // that they are available to all Vitest tests.
                React: 'readonly',
                shallow: 'readonly',
            },
        },
    },
];

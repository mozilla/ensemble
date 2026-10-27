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
        // The automatic JSX runtime doesn't need React in scope.
        files: ['**/*.{js,jsx}'],
        ...react.configs.flat['jsx-runtime'],
    },
    {
        files: ['**/*.{js,jsx}'],
        ...jsxA11y.flatConfigs.recommended,
    },
    {
        files: ['**/*.{js,jsx,mjs,cjs}'],
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
        },
    },
    {
        // React/JSX-a11y rules only make sense where the plugins above are
        // registered - .mjs/.cjs config files never contain JSX.
        files: ['**/*.{js,jsx}'],
        rules: {
            'jsx-a11y/no-onchange': 'off',
            // Requires the htmlFor/id association specifically, not just a
            // nested label - matches every <label> already in this codebase.
            'jsx-a11y/label-has-associated-control': ['error', { assert: 'htmlFor' }],
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
            // React Testing Library's `screen` export shadows window.screen;
            // importing it under that name is the library's documented idiom.
            'no-shadow': ['error', { builtinGlobals: true, allow: ['screen'] }],
        },
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.vitest,
            },
        },
    },
    {
        files: ['src/setupTests.js'],
        languageOptions: {
            globals: {
                ...globals.vitest,
            },
        },
    },
];

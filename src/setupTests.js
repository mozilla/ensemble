import React from 'react';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';


// The classic JSX runtime needs React in scope wherever JSX appears.
global.React = React;

// React reports deprecations and misuse through console.error, so treat any
// unexpected call as a failure. A test that expects an error replaces
// console.error with its own spy.
// eslint-disable-next-line no-console
const originalConsoleError = console.error;

beforeEach(() => {
    // eslint-disable-next-line no-console
    console.error = (...args) => {
        originalConsoleError(...args);
        throw new Error(`Unexpected console.error: ${args.join(' ')}`);
    };
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    sessionStorage.clear();
    // eslint-disable-next-line no-console
    console.error = originalConsoleError;
});

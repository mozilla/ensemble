import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import fetchCache from './lib/fetchCache';


// React reports deprecations and misuse through console.error, so treat any
// unexpected call as a failure. A test that expects an error replaces
// console.error with its own spy.
// eslint-disable-next-line no-console
const originalConsoleError = console.error;

beforeEach(() => {
    // jsdom has no scrolling and reports scrollTo through console.error.
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
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
    fetchCache.clear();
    // eslint-disable-next-line no-console
    console.error = originalConsoleError;
});

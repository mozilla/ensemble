import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';


export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    build: {
        outDir: 'build',
        // The oldest supported versions, as last checked in November 2026: the
        // current and previous major of each browser. Vite only rewrites
        // syntax for these and adds no polyfills. See "Supported browsers" in
        // CONTRIBUTING.md.
        target: ['chrome156', 'edge156', 'firefox159', 'safari26', 'ios26'],
    },
    test: {
        // Scope to the unit tests only - Vitest's default glob also matches
        // tests/playwright/specs/*.spec.js, which uses @playwright/test's own
        // `test`/`expect`, not Vitest's.
        include: ['src/tests/jest/**/*.test.jsx'],
        // Existing tests rely on Jest-style ambient globals (it, expect,
        // beforeAll) rather than importing them from the test runner.
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.js'],
    },
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';


export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    build: {
        outDir: 'build',
        // The supported browser floor: current Firefox ESR and Safari 15.6.
        // Chrome and Edge keep Vite 8's default. Vite only rewrites syntax for
        // these; it adds no polyfills, so new built-in methods must be checked
        // by hand. See "Supported browsers" in CONTRIBUTING.md.
        target: ['firefox153', 'safari15.6', 'ios15.6', 'chrome111', 'edge111'],
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

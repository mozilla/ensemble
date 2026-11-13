import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';


export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    build: {
        outDir: 'build',
        // Our browser support policy is Baseline Widely available. Vite fixes
        // the versions this means at each major release, so they lag behind
        // the policy, which is the safe direction. Vite only rewrites syntax
        // and adds no polyfills. See "Supported browsers" in CONTRIBUTING.md.
        target: 'baseline-widely-available',
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

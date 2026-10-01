import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';


export default defineConfig({
    plugins: [
        react({
            // React 16 doesn't support the automatic JSX runtime (added in React
            // 17); every file in this codebase already assumes the classic
            // runtime, where React must be in scope wherever JSX is used.
            jsxRuntime: 'classic',
        }),
    ],
    server: {
        port: 3000,
    },
    build: {
        outDir: 'build',
        // Needed for `npm run size` (source-map-explorer) to inspect the
        // production bundle's composition.
        sourcemap: true,
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

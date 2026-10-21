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
    optimizeDeps: {
        // The React plugin sets the classic runtime for transforms but not for
        // Vite's dependency scan, which then assumes the automatic runtime,
        // fails to resolve react/jsx-dev-runtime (React 16 has none), and
        // skips pre-bundling. The dev server then discovers dependencies one
        // page at a time, answering "504 (Outdated Optimize Dep)" and
        // reloading on first visits.
        rolldownOptions: {
            transform: {
                jsx: { runtime: 'classic' },
            },
        },
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

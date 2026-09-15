import { defineConfig } from 'vite';
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
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      // Scope discovery to the app. `semantic-work-graph/` is a separate
      // sub-project with its own package.json and native deps (sqlite3) that the
      // root install does not provide — picking it up made CI fail while local
      // runs passed, purely because it has its own node_modules on disk here.
      // It is excluded from tsconfig for the same reason.
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});

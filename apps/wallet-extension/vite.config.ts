import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/index.html'),
        sidepanel: resolve(__dirname, 'sidepanel/index.html'),
        'background/service-worker': resolve(__dirname, 'background/service-worker.ts'),
        'content/inject': resolve(__dirname, 'content/inject.ts'),
        'content/provider': resolve(__dirname, 'content/provider.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});

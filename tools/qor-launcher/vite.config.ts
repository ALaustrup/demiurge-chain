import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

// The launcher is a desktop SPA served by Tauri, not a website. There is no SSR,
// no routing server and no SEO surface, so Vite is the right tool and Next.js
// would only add a static-export dance for nothing.
export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    // Tauri drives this port from tauri.conf.json devUrl; keep the two in step.
    port: 5183,
    strictPort: true,
    // The host is cargo's to watch, not Vite's. On Windows a build script's .exe
    // under src-tauri/target is locked while it runs, and watching it crashed the
    // dev server with EBUSY, taking `tauri dev` down with it.
    watch: { ignored: ['**/src-tauri/**'] },
  },
  build: {
    // Tauri ships its own WebView2/WebKit, so we can target a modern baseline
    // and skip the legacy transpilation a browser build would need.
    target: 'es2022',
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
  clearScreen: false,
});

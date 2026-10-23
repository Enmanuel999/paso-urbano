import { defineConfig } from 'vite';

export default defineConfig({
  root: 'client',
  publicDir: false,
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3000', '/images': 'http://127.0.0.1:3000' },
  },
  build: { outDir: '../dist', emptyOutDir: true },
});

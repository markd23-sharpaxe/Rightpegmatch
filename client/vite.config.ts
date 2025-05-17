import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Important: Add these aliases to fix the schema imports
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared')
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Mark shared/schema as external to avoid bundling issues
      external: [
        /^@shared\/schema/
      ],
    },
  },
});
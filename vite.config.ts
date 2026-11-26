import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the built app works from any folder or static host (HashRouter handles routes).
export default defineConfig({
  base: './',
  plugins: [react()],
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3113',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('echarts')) return 'echarts';
          if (id.includes('react') || id.includes('react-router')) return 'react';
          if (id.includes('pdfmake')) return 'pdfmake';
        },
      },
    },
  },
});

// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // 👈 Thêm dòng này
  },
  server: {
    port: 3000, // Đặt Vite dev server chạy ở port 3000
    proxy: {
      '/api': 'http://localhost:5000', // Chuyển tiếp các request /api đến backend
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

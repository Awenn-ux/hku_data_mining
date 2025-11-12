import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 构建配置：使用相对路径，这样可以在任何路径下部署
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保使用相对路径
    rollupOptions: {
      output: {
        // 使用相对路径
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  // 开发服务器配置（仅开发时使用）
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})


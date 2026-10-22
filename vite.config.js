import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  /**
   * 相对路径打包：dist/ 可直接放在域名根目录，也可放在任意子目录
   * （如 https://example.com/drawings/）或内网静态服务器上，无需改配置。
   * 若部署在根目录并希望使用绝对路径，可改为 base: '/'。
   */
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5273,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2019',
    // 两个入口：流程演示（index.html）+ 部门工作台（workbench.html）
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        workbench: fileURLToPath(new URL('./workbench.html', import.meta.url)),
      },
    },
  },
})

/**
 * 以「客户端模式」打包冒烟测试入口（不能用 --ssr，否则 SFC 会被编译成 SSR 渲染函数，无法在 jsdom 中挂载）
 */
import { build } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

await build({
  configFile: false,
  mode: 'development',
  logLevel: 'warn',
  plugins: [vue()],
  define: { 'process.env.NODE_ENV': '"development"' },
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  build: {
    outDir: 'dist-smoke',
    emptyOutDir: true,
    minify: false,
    lib: { entry: 'scripts/smoke.js', formats: ['es'], fileName: () => 'smoke.js' },
    rollupOptions: { external: ['jsdom'] },
  },
})

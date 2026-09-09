import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * AutoInsight 构建配置
 * - `@` 别名指向 src
 * - 开发期可通过 VITE_DEV_PROXY_TARGET 把 /api 代理到真实 FastAPI 后端
 */
export default defineConfig(({ mode }) => {
  // 读取 .env / .env.development 中的变量（Vite 不会自动注入到 process.env）
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 使用 modern-compiler API，避免 sass 旧版 @import 弃用告警
          api: 'modern-compiler'
        }
      }
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        // 当 VITE_USE_MOCK=false 时，把 /api 代理到真实 FastAPI 服务
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          ws: false
        }
      }
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks: {
            echarts: ['echarts'],
            'element-plus': ['element-plus', '@element-plus/icons-vue'],
            vendor: ['vue', 'vue-router', 'pinia', 'axios']
          }
        }
      }
    }
  }
})

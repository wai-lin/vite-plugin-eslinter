import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { pluginEslinter } from 'vite-plugin-eslinter'
import { ESLint } from 'eslint'

const eslint = new ESLint()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    pluginEslinter(eslint, {
      lintFiles: ['src/**/*.{ts,vue}'],
    }),
  ],
})

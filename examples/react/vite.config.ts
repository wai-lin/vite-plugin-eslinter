import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ESLint } from 'eslint'
import { pluginEslinter } from 'vite-plugin-eslinter'
import { eslinterConfig } from './vite-plugin-eslinter.config'

const eslint = new ESLint()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pluginEslinter(eslint, eslinterConfig)],
})

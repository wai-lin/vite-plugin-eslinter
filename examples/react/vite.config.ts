import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pluginEslinter } from 'vite-plugin-eslinter'
import { ESLint } from 'eslint'
import * as path from 'path'

const eslint = new ESLint()
const projRoot = path.resolve(__dirname)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pluginEslinter(eslint, {
      lintFiles: [path.resolve(projRoot, './src/**/*.{ts,tsx}')],
      // formatter: {
      // console: 'compact',
      // },
      // showLogOn: {
      // browser: false,
      // browserConsole: false,
      // console: false,
      // },
    }),
  ],
})

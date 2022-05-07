# Vite Plugin Eslinter

#### step 1.

```sh
npm install -D eslint vite-plugin-eslinter
```

#### step 2.

```ts
// vite.config.js
...
import { ESLint } from 'eslint'
import { pluginEslinter } from 'vite-plugin-eslinter'
import path from 'path'

const projDir = path.resolve(__dirname)
const eslint = new ESLint()

export default defineConfig({
  ...,
  plugins: [
    ...,
    pluginEslinter(eslint, {
      lintFiles: [path.resolve(projDir, 'src/**/*.{ts,tsx}')],
    })
  ]
})
```

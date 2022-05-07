import type { PluginOption, ViteDevServer } from 'vite'
import type { ESLint } from 'eslint'
import path from 'node:path'
import fs from 'node:fs'
import { eslinter, eslinterFormatter } from '~/eslint'
import { baseRendererUi } from './base-renderer-ui'

function normalizePath(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join('/')
}

export interface TPluginEslinterConfig {
  /** directory pattern to search and lint to */
  lintFiles: string | string[]
  /**
   * Base host url of the development environment to use
   * when the port is not `3000` or the host is not `localhost`
   *
   * eg: `http://localhost:4000`
   *
   * eg: `http://mylocal.host`
   */
  hostUrl?: string
  /**
   * Decide where the lint report should be generated.
   * (default: all `true`)
   *
   * eg: only show on console
   * ```js
   * {
   *   ...,
   *   showLogOn: {
   *     console: true,
   *     browser: false,
   *     file: false,
   *   }
   * }
   * ```
   */
  showLogOn?: {
    browser?: boolean
    browserConsole?: boolean
    console?: boolean
  }
  /**
   * Eslint formatter to use.
   * (default: `stylish` for console, `html` for browser)
   */
  formatter?: {
    browser?: 'html' | ((lintRes: ESLint.LintResult[]) => string)
    console?: string
  }
  /**
   * Base HTML UI renderer to use.
   *
   * > IMPORTANT: The html string returned by the `baseRendererUI` will replace
   * > the main `</body>` tag. So, please make sure to include the `</body>` tag
   * > in your html string.
   */
  baseRendererUI?: (ctx: { iframeUrl: string }) => string
}

export function pluginEslinter(
  eslint: ESLint,
  config: TPluginEslinterConfig,
): PluginOption {
  // variable to track whether the vite is loading the first time or not
  let firstTimeLoading = true

  // variable to track down the file in which the hot module reload script is added
  let hotUpdateFile: string | null = null

  // ws event name
  const wsEventName = 'vite-plugin-eslinter'

  // linter ui container id
  const linterUiId = 'vite-eslinter-pop-up-ui'

  // linter html result route
  const linterHtmlRouteName = '/vite-plugin-eslinter'
  // linter console result route
  const linterConsoleRouteName = '/vite-plugin-eslinter/console'

  // variable where the eslint result api route is added
  const linterHtmlRoute = config.hostUrl
    ? config.hostUrl + linterHtmlRouteName
    : 'http://localhost:3000' + linterHtmlRouteName

  let linterResultsRaw: ESLint.LintResult[] = []
  let lintResultConsole = ''
  let lintResultBrowser = ''

  const consoleFormatter = config.formatter?.console ?? 'stylish'
  const browserFormatter = config.formatter?.browser ?? 'html'

  const showLogOn: Required<TPluginEslinterConfig['showLogOn']> = {
    browser: config.showLogOn?.browser ?? true,
    browserConsole: config.showLogOn?.browserConsole ?? true,
    console: config.showLogOn?.console ?? true,
  }

  async function setLintResults() {
    linterResultsRaw = await eslinter(eslint, { lintFiles: config.lintFiles })
  }

  async function setConsoleLintResult() {
    lintResultConsole = await eslinterFormatter(eslint, linterResultsRaw, {
      formatter: consoleFormatter,
    })
  }

  async function setBrowserLintResult() {
    lintResultBrowser =
      typeof browserFormatter === 'function'
        ? browserFormatter(linterResultsRaw)
        : await eslinterFormatter(eslint, linterResultsRaw, {
            formatter: browserFormatter,
          })
  }

  async function runLinter() {
    if (showLogOn?.browser || showLogOn?.browserConsole || showLogOn?.console) {
      await setLintResults()

      if (showLogOn?.console || showLogOn.browserConsole)
        await setConsoleLintResult()

      if (showLogOn?.browser) await setBrowserLintResult()
    }
  }

  /**
   * return Plugin Config
   */
  return {
    name: 'vite-plugin-eslinter',
    apply(_, { command, mode }) {
      return command === 'serve' && mode === 'development'
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === linterConsoleRouteName) {
          await runLinter()

          res
            .writeHead(200, { 'Content-Type': 'application/json' })
            .end(JSON.stringify({ formattedStr: lintResultConsole }))
        } else if (req.url === linterHtmlRouteName) {
          await runLinter()

          res.setHeader('Content-Type', 'text/html')
          res.write(lintResultBrowser)
          res.end()
        } else {
          next()
        }
      })
    },

    async handleHotUpdate({ server }) {
      if (firstTimeLoading) firstTimeLoading = false

      await runLinter()

      if (linterResultsRaw.length > 0) {
        server.ws.send({
          type: 'custom',
          event: wsEventName,
          data: {
            hasESLintError: true,
            formattedStr: lintResultConsole,
          },
        })
      } else {
        server.ws.send({
          type: 'custom',
          event: wsEventName,
          data: { hasESLintError: false },
        })
      }
    },

    async load(id) {
      const file = normalizePath(id)

      const isFirstLoadedFile =
        !file.includes('node_modules/') &&
        hotUpdateFile === null &&
        fs.existsSync(file)

      // log linter results on console on every load
      if (
        !firstTimeLoading &&
        showLogOn.console &&
        linterResultsRaw.length > 0
      ) {
        console.clear()
        console.log(lintResultConsole)
      }

      /**
       * Add hot reload script when showOnBrowser(default: true) option enabled by user.
       * Also show the error ui on browser if there is any error.
       */
      if (
        (isFirstLoadedFile || file === hotUpdateFile) &&
        (showLogOn.browser || showLogOn.browserConsole)
      ) {
        hotUpdateFile = file
        const fileContent = fs.readFileSync(id).toString()

        const browserLogger = `
        console.warn(d.formattedStr)
        `
        const browserUiUpdater = `
        document.getElementById('#${linterUiId}').style.display = 'block'
        document.getElementById('#${linterUiId} iframe').src = '${linterHtmlRoute}'
        `
        const showBrowserUiOnLoad = `
        document.querySelector('#${linterUiId}').style.display = 'block'
        `
        const browserLoggerOnLoad = `
        fetch('${linterConsoleRouteName}')
        .then(r => r.json())
        .then(d => console.warn(d.formattedStr))
        `

        const clientJs = `
        if (import.meta.hot) {
          import.meta.hot.on('${wsEventName}', d => {
            if (d.hasESLintError) {
              ${showLogOn.browserConsole ? browserLogger : ''}
              ${showLogOn.browser ? browserUiUpdater : ''}
            }
          })
        }
        ${showLogOn.browser ? showBrowserUiOnLoad : ''}
        ${showLogOn.browserConsole ? browserLoggerOnLoad : ''}
        `

        const appendedScript = fileContent + clientJs

        return appendedScript
      }

      return null
    },

    async transformIndexHtml(html) {
      await runLinter()

      if (linterResultsRaw.length > 0 && showLogOn.console) {
        console.log(lintResultConsole)
      }

      if (!showLogOn.browser) return html

      return html.replace(
        '</body>',
        config.baseRendererUI
          ? config.baseRendererUI({ iframeUrl: linterHtmlRoute })
          : baseRendererUi({ linterUiId, linterHtmlRoute }),
      )
    },
  }
}

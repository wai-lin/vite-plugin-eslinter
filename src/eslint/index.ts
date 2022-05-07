import { ESLint } from 'eslint'

interface ESLinterConfig {
  lintFiles: string | string[]
}

export async function eslinter(eslint: ESLint, config: ESLinterConfig) {
  return await eslint.lintFiles(config.lintFiles)
}

interface ESLinterFormatterConfig {
  formatter?: string | ((lintRes: ESLint.LintResult[]) => string)
}
export async function eslinterFormatter(
  eslint: ESLint,
  lintRes: ESLint.LintResult[],
  config?: ESLinterFormatterConfig,
) {
  if (config?.formatter instanceof Function) return config.formatter(lintRes)

  const formatter = eslint.loadFormatter(config?.formatter ?? 'stylish')
  return (await formatter).format(lintRes)
}

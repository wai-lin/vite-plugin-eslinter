import { expect, it } from 'vitest'
import { ESLint } from 'eslint'
import path from 'node:path'
import fs from 'node:fs'

import { eslinter } from '~/eslint/index'
import { htmlFormatter } from '../index'

it('should render correct html format', async () => {
  const eslint = new ESLint()
  const lintRes = await eslinter(eslint, {
    lintFiles: [path.resolve(__dirname, './assets/lint-test.js?(x)')],
  })

  const htmlErrorStr = htmlFormatter(lintRes)
  const toCompareResult = fs.readFileSync(
    path.resolve(__dirname, './assets/test-result.html'),
    'utf8',
  )

  expect(htmlErrorStr).toEqual(toCompareResult)
})

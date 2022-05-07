import path from 'node:path'
import fs from 'node:fs'
import { ESLint } from 'eslint'

const resolvePath = (filePath: string) => path.resolve(__dirname, filePath)
const readFile = (filePath: string) =>
  fs.readFileSync(resolvePath(filePath), 'utf8')

/** html templates */
const templates = {
  base: readFile('./templates/index.template.html'),
  statisticReports: readFile('./templates/statistic-reports.template.html'),
  errorList: readFile('./templates/error-list.template.html'),
  errorListItem: readFile('./templates/error-list-item.template.html'),
}

/** function that decide whether or not plural `s` should be postfix a string */
function plural(n: string | number) {
  return Number(n) > 1 ? 's' : ''
}

/** addition of all the numbers in a array */
function addNumArr(numArr: number[]) {
  return numArr.reduce((a, c) => a + c, 0)
}

/**
 * decide the severity string value based on severity rank number
 *
 * - `2` => `error`
 * - `1` => `warning`
 * - `otherwise` => `off`
 */
function Severity(severity: number) {
  switch (severity) {
    case 2:
      return 'error'
    case 1:
      return 'warning'
    default:
      return 'off'
  }
}

/** calculate necessary statistics for reports and return as object */
function calcStatisticReports(lintRes: ESLint.LintResult[]) {
  const res = lintRes

  const TotalProblems = addNumArr(res.map((r) => r.errorCount)).toString()
  const TotalProblemsPlural = plural(TotalProblems)

  const ErrorsCount = addNumArr(
    res.map((r) => r.fatalErrorCount + r.fixableErrorCount),
  ).toString()
  const ErrorsCountPlural = plural(ErrorsCount)

  const WarningsCount = addNumArr(
    res.map((r) => r.warningCount + r.fixableWarningCount),
  ).toString()
  const WarningsCountPlural = plural(WarningsCount)

  const TotalFixableErrors = addNumArr(
    res.map((r) => r.fixableErrorCount),
  ).toString()
  const TotalFixableErrorsPlural = plural(TotalFixableErrors)

  const TotalFixableWarnings = addNumArr(
    res.map((r) => r.fixableWarningCount),
  ).toString()
  const TotalFixableWarningsPlural = plural(TotalFixableWarnings)

  return {
    TotalProblems,
    TotalProblemsPlural,

    ErrorsCount,
    ErrorsCountPlural,
    WarningsCount,
    WarningsCountPlural,

    TotalFixableErrors,
    TotalFixableErrorsPlural,
    TotalFixableWarnings,
    TotalFixableWarningsPlural,
  }
}

/**
 * Format the given ESLint result object into a HTML string and return it.
 * If no result is given, the function will return the given html string back.
 */
export function htmlFormatter(linterResultsRaw: ESLint.LintResult[]) {
  const res = linterResultsRaw

  /**
   * define enum replacements for the html templates
   *
   * re-assigning the enums later will ensure that the values are
   * always new every time the function is called
   */
  const replacements = {
    statisticReports: {
      TotalProblems: '',
      TotalProblemsPlural: '',

      ErrorsCount: '',
      ErrorsCountPlural: '',
      WarningsCount: '',
      WarningsCountPlural: '',

      TotalFixableErrors: '',
      TotalFixableErrorsPlural: '',
      TotalFixableWarnings: '',
      TotalFixableWarningsPlural: '',
    },
  }

  // 1: generate statistic reports values
  replacements.statisticReports = calcStatisticReports(res)

  // 2: populate generated statistic reports values into the html template
  Object.keys(replacements.statisticReports).forEach((key) => {
    templates.statisticReports = templates.statisticReports.replace(
      new RegExp(`{{${key}}}`, 'g'),
      (replacements.statisticReports as any)[key],
    )
  })

  // 3: loop through each lint error result and generate error list
  res.forEach((err) => {
    // 3.1: temporary error list to be populated,
    // so that the actually template is not getting override
    let errorList = templates.errorList

    // 3.2: populate error file path
    errorList = errorList.replace(/{{FilePath}}/g, err.filePath)

    // temporary error list items to be populated
    // so that the actually template will avoid
    // template duplication
    let errorListItems = ''

    // 3.3: loop through each lint error message and generate error list item
    err.messages.forEach((msg) => {
      // 3.4: temporary error list item to avoid template duplication
      let errorListItem = templates.errorListItem

      errorListItem = errorListItem.replace(/{{Line}}/g, `${msg.line}`)
      errorListItem = errorListItem.replace(/{{Column}}/g, `${msg.column}`)
      errorListItem = errorListItem.replace(
        /{{Severity}}/g,
        Severity(msg.severity),
      )
      errorListItem = errorListItem.replace(/{{Message}}/g, msg.message)
      errorListItem = errorListItem.replace(/{{RuleId}}/g, msg.ruleId ?? '')

      // 3.5: append the temporary error list item to the error list items
      errorListItems += errorListItem
    })

    // 3.6: populate slot with error list items
    errorList = errorList.replace(/{{Slot}}/g, errorListItems)

    // 3.7: assign the temporary error list to the html template
    // so that the base template can be populated with
    templates.errorList = errorList
  })

  // 4: populate the base template with the error list
  templates.base = templates.base.replace(
    /{{LinterErrors}}/g,
    templates.errorList,
  )

  // 5: populate the base template with statistic reports
  templates.base = templates.base.replace(
    /{{StatisticReports}}/g,
    templates.statisticReports,
  )

  // 6: return the html template
  return templates.base
}

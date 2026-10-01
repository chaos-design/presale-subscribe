const spreadsheetFormulaPattern = /^(?:[ \t\r\n]*[=+\-@]|[\t\r\n])/

export function escapeCsvCell(value: string) {
  const safeValue = spreadsheetFormulaPattern.test(value) ? `'${value}` : value

  return `"${safeValue.replaceAll('"', '""')}"`
}

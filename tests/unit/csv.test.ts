import { describe, expect, it } from "vitest"

import { escapeCsvCell } from "@/lib/csv"

describe("escapeCsvCell", () => {
  it("quotes CSV delimiters and embedded quotes", () => {
    expect(escapeCsvCell('alpha, "beta"')).toBe('"alpha, ""beta"""')
  })

  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)", ' =HYPERLINK("https://example.com")'])(
    "neutralizes spreadsheet formula input %s",
    (value) => {
      expect(escapeCsvCell(value)).toBe(`"'${value.replaceAll('"', '""')}"`)
    }
  )

  it("neutralizes leading control characters", () => {
    expect(escapeCsvCell("\tmalicious")).toBe('"\'\tmalicious"')
    expect(escapeCsvCell("\rmalicious")).toBe('"\'\rmalicious"')
    expect(escapeCsvCell("\nmalicious")).toBe('"\'\nmalicious"')
  })
})

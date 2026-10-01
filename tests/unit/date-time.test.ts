import { describe, expect, it } from "vitest"

import { formatLocalDateTime, parseLocalDateTime } from "@/lib/date-time"

describe("date-time helpers", () => {
  it("formats local date time with seconds", () => {
    const date = new Date(2026, 8, 19, 17, 54, 9)

    expect(formatLocalDateTime(date)).toBe("2026-09-19 17:54:09")
  })

  it("parses local date time to an ISO timestamp", () => {
    const expected = new Date(2026, 8, 19, 17, 54, 9).toISOString()

    expect(parseLocalDateTime("2026-09-19 17:54:09")).toBe(expected)
  })

  it("rejects incomplete or impossible date time values", () => {
    expect(parseLocalDateTime("2026-09-19T17:54")).toBe("")
    expect(parseLocalDateTime("2026-02-31 17:54:09")).toBe("")
    expect(parseLocalDateTime("2026-09-19 24:00:00")).toBe("")
  })
})

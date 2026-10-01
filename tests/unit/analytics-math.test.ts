import { describe, expect, it } from "vitest"

import { splitMetric } from "@/lib/analytics-math"

describe("analytics metric allocation", () => {
  it("keeps every bucket non-negative while preserving the total", () => {
    const values = splitMetric(2, [0.26, 0.26, 0.26, 0.22])

    expect(values).toHaveLength(4)
    expect(values.every((value) => value >= 0)).toBe(true)
    expect(values.reduce((sum, value) => sum + value, 0)).toBe(2)
  })

  it("supports sparse totals across long analytics ranges", () => {
    const values = splitMetric(
      490,
      Array.from({ length: 90 }, (_, index) => 1 + (index % 7))
    )

    expect(values).toHaveLength(90)
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(values.reduce((sum, value) => sum + value, 0)).toBe(490)
  })

  it("normalizes weights before allocating integer values", () => {
    expect(splitMetric(10, [2, 3])).toEqual([4, 6])
    expect(splitMetric(10, [0, 0])).toEqual([0, 0])
  })
})

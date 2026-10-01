import { describe, expect, it } from "vitest"

import { formatDuration, formatLocation, getCountryName } from "@/lib/analytics-display"

describe("analytics display", () => {
  it("formats engagement durations without noisy zero units", () => {
    expect(formatDuration(42)).toBe("42 秒")
    expect(formatDuration(120)).toBe("2 分钟")
    expect(formatDuration(3670)).toBe("1 小时 1 分")
  })

  it("builds coarse location labels and removes duplicate segments", () => {
    expect(
      formatLocation({
        city: "上海",
        countryCode: "CN",
        region: "上海",
      })
    ).toBe(`${getCountryName("CN")} · 上海`)
    expect(formatLocation({ city: null, countryCode: null, region: null })).toBe("未知地区")
  })
})

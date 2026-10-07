import { describe, expect, it } from "vitest"

import { getPasswordStrength } from "@/lib/password-strength"

describe("getPasswordStrength", () => {
  it("keeps short single-category passwords weak", () => {
    expect(getPasswordStrength("password")).toMatchObject({
      score: 1,
      isStrong: false,
      label: "较弱",
    })
  })

  it("accepts passwords that meet length and two additional categories", () => {
    expect(getPasswordStrength("Reps2026")).toMatchObject({
      score: 3,
      isStrong: true,
      label: "较强",
    })
  })

  it("marks passwords meeting every criterion as secure", () => {
    expect(getPasswordStrength("Reps@2026")).toMatchObject({
      score: 4,
      isStrong: true,
      label: "安全",
    })
  })
})

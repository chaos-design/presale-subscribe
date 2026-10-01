import { describe, expect, it } from "vitest"

import { sanitizeRedirectPath } from "@/lib/redirect-path"

describe("sanitizeRedirectPath", () => {
  it("keeps local paths with query strings and fragments", () => {
    expect(sanitizeRedirectPath("/dashboard?view=published#recent")).toBe(
      "/dashboard?view=published#recent"
    )
  })

  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example",
    "javascript:alert(1)",
  ])("rejects unsafe redirect %s", (value) => {
    expect(sanitizeRedirectPath(value)).toBe("/dashboard")
  })

  it("supports a caller-provided fallback", () => {
    expect(sanitizeRedirectPath(undefined, "/")).toBe("/")
  })
})

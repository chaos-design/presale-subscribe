import { afterEach, describe, expect, it, vi } from "vitest"

import {
  extractPublicClientIp,
  readLocationHeaders,
  resolveRequestLocation,
} from "@/lib/request-location"

describe("request location", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("decodes platform-provided location headers", () => {
    const headers = new Headers({
      "x-vercel-ip-city": "%E4%B8%8A%E6%B5%B7",
      "x-vercel-ip-country": "cn",
      "x-vercel-ip-country-region": "%E4%B8%8A%E6%B5%B7",
    })

    expect(readLocationHeaders(headers)).toEqual({
      city: "上海",
      countryCode: "CN",
      region: "上海",
    })
  })

  it("uses the first public address from trusted proxy headers", () => {
    const headers = new Headers({
      "x-forwarded-for": "10.0.0.4, 8.8.8.8, 203.0.113.10",
    })

    expect(extractPublicClientIp(headers)).toBe("8.8.8.8")
  })

  it("does not send private or documentation addresses for lookup", () => {
    const headers = new Headers({
      "cf-connecting-ip": "192.168.1.12",
      "x-forwarded-for": "203.0.113.10",
    })

    expect(extractPublicClientIp(headers)).toBeNull()
  })

  it("resolves missing location fields from a public client IP", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          country_code: "US",
          region: "California",
          city: "Mountain View",
        })
      )
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(resolveRequestLocation(new Headers({ "x-real-ip": "8.8.8.8" }))).resolves.toEqual({
      city: "Mountain View",
      countryCode: "US",
      region: "California",
    })
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ipwho.is/8.8.8.8?fields=success,country_code,region,city",
      expect.objectContaining({ cache: "no-store" })
    )
  })
})

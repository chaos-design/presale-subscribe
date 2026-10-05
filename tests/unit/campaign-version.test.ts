import { describe, expect, it } from "vitest"

import { createCampaignConfig } from "@/lib/campaign-presets"
import { createCampaignVersion } from "@/lib/campaign-version"

describe("campaign content version", () => {
  it("returns a short lowercase hex fingerprint", () => {
    const version = createCampaignVersion(createCampaignConfig("launch"))

    expect(version).toMatch(/^[0-9a-f]{8}$/)
  })

  it("stays stable when object key order changes", () => {
    const config = createCampaignConfig("launch")
    const reordered = Object.fromEntries(Object.entries(config).reverse()) as typeof config

    expect(createCampaignVersion(reordered)).toBe(createCampaignVersion(config))
  })

  it("changes when any published content changes", () => {
    const config = createCampaignConfig("launch")

    expect(createCampaignVersion({ ...config, title: "Ahead 3.0" })).not.toBe(
      createCampaignVersion(config)
    )
    expect(
      createCampaignVersion({
        ...config,
        pageContent: {
          ...config.pageContent,
          highlights: [{ label: "B", title: "B", description: "B" }],
        },
      })
    ).not.toBe(createCampaignVersion(config))
  })

  it("respects array order", () => {
    const config = createCampaignConfig("launch")
    const reversed = {
      ...config,
      pageContent: {
        ...config.pageContent,
        highlights: [...config.pageContent.highlights].reverse(),
      },
    }

    expect(createCampaignVersion(reversed)).not.toBe(createCampaignVersion(config))
  })
})

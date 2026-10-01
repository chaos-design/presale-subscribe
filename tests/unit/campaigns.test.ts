import { describe, expect, it } from "vitest"

import { demoCampaignSlug, getCampaigns, getPublicCampaign } from "@/lib/campaigns"

describe("getPublicCampaign", () => {
  it("always exposes the built-in product demo", async () => {
    const campaign = await getPublicCampaign(demoCampaignSlug)

    expect(campaign).toMatchObject({
      id: "demo-launch",
      slug: demoCampaignSlug,
      config: {
        title: "下一次更新，先让你知道",
      },
    })
  })

  it("does not preload remote cover images in mock campaigns", async () => {
    const campaigns = await getCampaigns()
    const editorial = campaigns.find((campaign) => campaign.id === "demo-editorial")
    const signal = campaigns.find((campaign) => campaign.id === "demo-signal")

    expect(editorial?.draft_config.coverImage).toBe("")
    expect(signal?.draft_config.coverImage).toBe("")
    expect(signal?.published_config?.coverImage).toBe("")
  })
})

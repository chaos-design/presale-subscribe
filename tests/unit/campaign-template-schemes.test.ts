import { describe, expect, it } from "vitest"

import { campaignTemplateSchemes } from "@/lib/campaign-template-schemes"

describe("campaign template schemes", () => {
  it("gives every template a complete layout system", () => {
    const subscriptionLayouts = new Set<string>()

    for (const scheme of Object.values(campaignTemplateSchemes)) {
      expect(new Set(scheme.layout.sectionOrder)).toEqual(
        new Set(["video", "highlights", "signup", "slogan", "timeline"])
      )
      expect(scheme.layout.sectionOrder).toHaveLength(5)
      expect(["column", "matrix", "sidebar"]).toContain(scheme.layout.subscription)
      subscriptionLayouts.add(scheme.layout.subscription)
    }

    expect(subscriptionLayouts).toEqual(new Set(["column", "matrix", "sidebar"]))
  })

  it("uses a distinct layout signature for every template", () => {
    const signatures = Object.values(campaignTemplateSchemes).map((scheme) =>
      JSON.stringify(scheme.layout)
    )

    expect(new Set(signatures).size).toBe(signatures.length)
  })
})

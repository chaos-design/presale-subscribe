import { describe, expect, it } from "vitest"

import { createCampaignConfig } from "@/lib/campaign-presets"
import { campaignConfigSchema, emailSchema } from "@/lib/validation"

describe("campaignConfigSchema", () => {
  it("accepts common email providers and rejects unknown domains", () => {
    expect(emailSchema.safeParse("reader@gmail.com").success).toBe(true)
    expect(emailSchema.safeParse("reader@qq.com").success).toBe(true)

    const result = emailSchema.safeParse("reader@temporary.example")

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain("常用邮箱")
  })

  it("accepts complete feature copy with a supported template motion", () => {
    expect(
      campaignConfigSchema.safeParse({
        ...createCampaignConfig("editorial"),
        name: "Editorial release",
        intent: "draft",
      }).success
    ).toBe(true)
  })

  it("rejects motion systems that are unavailable for the template", () => {
    const result = campaignConfigSchema.safeParse({
      ...createCampaignConfig("editorial"),
      motion: "kinetic",
      name: "Editorial release",
      intent: "publish",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.motion).toContain("当前模板不支持该页面动效")
  })

  it("validates preview video playback and detailed motion settings", () => {
    const config = createCampaignConfig("launch")
    const invalidAutoplay = campaignConfigSchema.safeParse({
      ...config,
      previewVideo: {
        ...config.previewVideo,
        autoplay: true,
        muted: false,
        url: "https://example.com/preview.mp4",
      },
      name: "Video preview",
      intent: "draft",
    })
    const invalidSpeed = campaignConfigSchema.safeParse({
      ...config,
      motionSettings: {
        ...config.motionSettings,
        speed: 2,
      },
      name: "Motion controls",
      intent: "draft",
    })

    expect(invalidAutoplay.success).toBe(false)
    expect(invalidAutoplay.error?.flatten().fieldErrors.previewVideo).toBeDefined()
    expect(invalidSpeed.success).toBe(false)
    expect(invalidSpeed.error?.flatten().fieldErrors.motionSettings).toBeDefined()
  })

  it("rejects cover image positions outside the crop range", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      coverImagePosition: { x: 50, y: 101 },
      name: "Invalid image position",
      intent: "draft",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.coverImagePosition).toBeDefined()
  })

  it("accepts owner-provided campaign media URLs", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      coverImage: "https://avatars.githubusercontent.com/u/20939839?v=4",
      previewVideo: {
        ...config.previewVideo,
        url: "https://media.example.com/campaign/preview.mp4",
      },
      name: "Owner media",
      intent: "draft",
    })

    expect(result.success).toBe(true)
  })

  it("rejects choice questions without enough unique options", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      questionnaire: {
        ...config.questionnaire,
        questions: [
          {
            ...config.questionnaire.questions[0],
            options: ["同一个选项", "同一个选项"],
          },
        ],
      },
      name: "Questionnaire validation",
      intent: "publish",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.questionnaire).toBeDefined()
  })

  it("requires at least one question when collection is enabled", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      questionnaire: {
        ...config.questionnaire,
        questions: [],
      },
      name: "Questionnaire validation",
      intent: "draft",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.questionnaire).toBeDefined()
  })

  it("requires an email label and allows hiding the signup section", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      emailLabel: "",
      sectionVisibility: {
        ...config.sectionVisibility,
        signup: false,
      },
      name: "Required email",
      intent: "draft",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.emailLabel).toBeDefined()
    expect(result.error?.flatten().fieldErrors.sectionVisibility).toBeUndefined()
  })

  it("requires a valid target time when countdown is enabled", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      countdown: {
        ...config.countdown,
        enabled: true,
        targetAt: "",
      },
      name: "Countdown validation",
      intent: "draft",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.countdown).toBeDefined()
  })

  it("accepts one content item and rejects more than six", () => {
    const config = createCampaignConfig("launch")
    const singleItemResult = campaignConfigSchema.safeParse({
      ...config,
      pageContent: {
        ...config.pageContent,
        highlights: config.pageContent.highlights.slice(0, 1),
        milestones: config.pageContent.milestones.slice(0, 1),
      },
      name: "Flexible content",
      intent: "draft",
    })
    const tooManyResult = campaignConfigSchema.safeParse({
      ...config,
      pageContent: {
        ...config.pageContent,
        highlights: Array.from({ length: 7 }, () => config.pageContent.highlights[0]),
      },
      name: "Too much content",
      intent: "draft",
    })

    expect(singleItemResult.success).toBe(true)
    expect(tooManyResult.success).toBe(false)
    expect(tooManyResult.error?.flatten().fieldErrors.pageContent).toBeDefined()
  })

  it("rejects duplicate section order and oversized header labels", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      sectionOrder: ["video", "highlights", "highlights", "timeline", "signup"],
      header: {
        ...config.header,
        brandLabel: "A".repeat(25),
      },
      name: "Invalid page structure",
      intent: "draft",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.sectionOrder).toBeDefined()
    expect(result.error?.flatten().fieldErrors.header).toBeDefined()
  })

  it("validates marquee content and speed", () => {
    const config = createCampaignConfig("launch")
    const result = campaignConfigSchema.safeParse({
      ...config,
      marquee: {
        content: "",
        infinite: true,
        speed: 4,
      },
      name: "Invalid marquee",
      intent: "draft",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.marquee).toBeDefined()
  })
})

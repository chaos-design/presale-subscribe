import { describe, expect, it } from "vitest"

import {
  createCampaignConfig,
  defaultCampaignConfig,
  getMotionOptionsForTemplate,
  getThemeForeground,
  isMotionAvailableForTemplate,
  motionOptions,
  normalizeCampaignConfig,
  templateOptions,
  themeOptions,
} from "@/lib/campaign-presets"

describe("campaign presets", () => {
  it("provides unique templates and theme colors", () => {
    expect(new Set(templateOptions.map((option) => option.value)).size).toBe(templateOptions.length)
    expect(new Set(themeOptions.map((option) => option.value)).size).toBe(themeOptions.length)
    expect(new Set(motionOptions.map((option) => option.value)).size).toBe(motionOptions.length)
  })

  it("merges partial campaign data with defaults", () => {
    expect(normalizeCampaignConfig({ title: "New release" })).toEqual({
      ...defaultCampaignConfig,
      title: "New release",
    })
  })

  it("creates a complete configuration for every template", () => {
    for (const option of templateOptions) {
      expect(createCampaignConfig(option.value)).toMatchObject({
        template: option.value,
      })
      expect(createCampaignConfig(option.value).coverImage).toBe("")
      expect(createCampaignConfig(option.value).coverImagePosition).toEqual({ x: 50, y: 50 })
      expect(createCampaignConfig(option.value).previewVideo).toMatchObject({
        autoplay: false,
        muted: true,
      })
      expect(createCampaignConfig(option.value).featureTitle.length).toBeGreaterThan(0)
      expect(createCampaignConfig(option.value).pageContent.highlights).toHaveLength(3)
      expect(createCampaignConfig(option.value).pageContent.milestones).toHaveLength(3)
      expect(createCampaignConfig(option.value).sectionVisibility).toEqual({
        hero: true,
        video: true,
        highlights: true,
        slogan: true,
        timeline: true,
        signup: true,
      })
      expect(new Set(createCampaignConfig(option.value).sectionOrder)).toEqual(
        new Set(["video", "highlights", "slogan", "timeline", "signup"])
      )
      expect(createCampaignConfig(option.value).header).toMatchObject({
        enabled: true,
        brandLabel: "REPS",
        showSlogan: true,
      })
      expect(createCampaignConfig(option.value).marquee).toEqual({
        content: createCampaignConfig(option.value).slogan,
        infinite: true,
        speed: 24,
      })
      expect(
        isMotionAvailableForTemplate(option.value, createCampaignConfig(option.value).motion)
      ).toBe(true)
      expect(createCampaignConfig(option.value).emailLabel.length).toBeGreaterThan(0)
      expect(createCampaignConfig(option.value).questionnaire.questions.length).toBeGreaterThan(0)
    }
  })

  it("returns independent questionnaire copies for editor state", () => {
    const first = createCampaignConfig("launch")
    const second = createCampaignConfig("launch")

    expect(first.questionnaire).not.toBe(second.questionnaire)
    expect(first.questionnaire.questions[0]).not.toBe(second.questionnaire.questions[0])
    expect(first.questionnaire.questions[0].options).not.toBe(
      second.questionnaire.questions[0].options
    )
    expect(first.sectionVisibility).not.toBe(second.sectionVisibility)
    expect(first.sectionOrder).not.toBe(second.sectionOrder)
    expect(first.header).not.toBe(second.header)
    expect(first.marquee).not.toBe(second.marquee)
    expect(first.previewVideo).not.toBe(second.previewVideo)
    expect(first.motionSettings).not.toBe(second.motionSettings)
  })

  it("provides template-specific motion options", () => {
    expect(getMotionOptionsForTemplate("editorial").map((option) => option.value)).toEqual([
      "cascade",
      "drift",
      "scan",
      "parallax",
    ])
    expect(getMotionOptionsForTemplate("kinetic").map((option) => option.value)).toEqual([
      "cascade",
      "scan",
      "pulse",
      "kinetic",
    ])
    for (const template of templateOptions) {
      expect(getMotionOptionsForTemplate(template.value).length).toBeGreaterThanOrEqual(4)
    }
  })

  it("keeps accent text readable on light and dark colors", () => {
    expect(getThemeForeground("#F2F4EE")).toBe("#11110F")
    expect(getThemeForeground("#111111")).toBe("#FFFFFF")
  })

  it("keeps owner-provided media URLs", () => {
    expect(
      normalizeCampaignConfig({
        coverImage: "https://avatars.githubusercontent.com/u/20939839?v=4",
      }).coverImage
    ).toBe("https://avatars.githubusercontent.com/u/20939839?v=4")
    expect(
      normalizeCampaignConfig({
        previewVideo: {
          autoplay: false,
          loop: false,
          muted: true,
          posterUrl: "https://media.example.com/campaign/poster.jpg",
          url: "https://media.example.com/campaign/preview.mp4",
        },
      }).previewVideo
    ).toMatchObject({
      posterUrl: "https://media.example.com/campaign/poster.jpg",
      url: "https://media.example.com/campaign/preview.mp4",
    })
  })

  it("falls back when a stored template is unsupported", () => {
    const normalized = normalizeCampaignConfig({
      template: "unsupported" as typeof defaultCampaignConfig.template,
      motion: "unsupported" as typeof defaultCampaignConfig.motion,
    })

    expect(normalized.template).toBe(defaultCampaignConfig.template)
    expect(normalized.motion).toBe(defaultCampaignConfig.motion)
  })

  it("keeps stored module visibility and fills missing legacy visibility", () => {
    const normalized = normalizeCampaignConfig({
      sectionVisibility: {
        ...defaultCampaignConfig.sectionVisibility,
        timeline: false,
        signup: false,
      },
    })

    expect(normalized.sectionVisibility.timeline).toBe(false)
    expect(normalized.sectionVisibility.signup).toBe(false)
    expect(normalizeCampaignConfig({ title: "Legacy project" }).sectionVisibility).toEqual(
      defaultCampaignConfig.sectionVisibility
    )
    expect(normalizeCampaignConfig({ title: "Legacy project" }).countdown).toEqual(
      defaultCampaignConfig.countdown
    )
  })

  it("keeps custom email labels and repairs missing labels", () => {
    expect(normalizeCampaignConfig({ emailLabel: "工作邮箱" }).emailLabel).toBe("工作邮箱")
    expect(normalizeCampaignConfig({ emailLabel: "" }).emailLabel).toBe(
      defaultCampaignConfig.emailLabel
    )
  })

  it("keeps custom section order, header, and marquee while repairing legacy values", () => {
    const legacyOrder = normalizeCampaignConfig({
      sectionOrder: ["signup", "highlights", "timeline", "slogan"],
    })
    const normalized = normalizeCampaignConfig({
      sectionOrder: ["signup", "highlights"] as typeof defaultCampaignConfig.sectionOrder,
      header: {
        enabled: false,
        brandLabel: "NEXT",
        metaLabel: "BETA-07",
        showSlogan: false,
      },
      marquee: {
        content: "A custom release signal",
        infinite: false,
        speed: 42,
      },
    })

    expect(legacyOrder.sectionOrder).toEqual([
      "video",
      "signup",
      "highlights",
      "timeline",
      "slogan",
    ])
    expect(normalized.sectionOrder).toEqual(defaultCampaignConfig.sectionOrder)
    expect(normalized.header).toEqual({
      enabled: false,
      brandLabel: "NEXT",
      metaLabel: "BETA-07",
      showSlogan: false,
    })
    expect(normalized.marquee).toEqual({
      content: "A custom release signal",
      infinite: false,
      speed: 42,
    })
    expect(normalizeCampaignConfig({ slogan: "Legacy slogan" }).marquee).toEqual({
      content: "Legacy slogan",
      infinite: true,
      speed: 24,
    })
  })

  it("normalizes video playback and detailed motion settings", () => {
    const normalized = normalizeCampaignConfig({
      previewVideo: {
        autoplay: true,
        loop: true,
        muted: false,
        posterUrl: "https://example.com/preview-poster.jpg",
        url: "https://example.com/preview.mp4",
      },
      motionSettings: {
        ambient: false,
        entrance: false,
        intensity: "bold",
        parallax: false,
        scrollReveal: false,
        speed: 3,
      },
    })

    expect(normalized.previewVideo).toEqual({
      autoplay: true,
      loop: true,
      muted: true,
      posterUrl: "https://example.com/preview-poster.jpg",
      url: "https://example.com/preview.mp4",
    })
    expect(normalized.motionSettings).toEqual({
      ambient: false,
      entrance: false,
      intensity: "bold",
      parallax: false,
      scrollReveal: false,
      speed: 1.8,
    })
  })

  it("repairs legacy and out-of-range image positions", () => {
    expect(normalizeCampaignConfig({ title: "Legacy project" }).coverImagePosition).toEqual({
      x: 50,
      y: 50,
    })
    expect(
      normalizeCampaignConfig({
        coverImagePosition: { x: -20, y: 140 },
      }).coverImagePosition
    ).toEqual({ x: 0, y: 100 })
  })
})

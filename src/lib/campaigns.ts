import { cache } from "react"
import { z } from "zod"

import { getCurrentUser } from "@/lib/auth"
import { createCampaignConfig, normalizeCampaignConfig } from "@/lib/campaign-presets"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Campaign, PublicCampaign, Subscriber } from "@/types/database"

export const demoCampaignSlug = "ahead-2-preview"

const subscriberSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  email: z.string(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  created_at: z.string(),
  analytics: z
    .object({
      campaignTag: z.string().nullable(),
      city: z.string().nullable(),
      countryCode: z.string().nullable(),
      deviceType: z.enum(["desktop", "mobile", "tablet", "unknown"]),
      engagementSeconds: z.number().nonnegative(),
      firstSeenAt: z.string(),
      interactionCount: z.number().nonnegative(),
      lastSeenAt: z.string(),
      locale: z.string().nullable(),
      maxScrollDepth: z.number().min(0).max(100),
      medium: z.string().nullable(),
      pageViews: z.number().nonnegative(),
      region: z.string().nullable(),
      sessions: z.number().nonnegative(),
      source: z.string(),
      timezone: z.string().nullable(),
    })
    .nullable(),
})

const demoCampaigns: Campaign[] = [
  {
    id: "demo-launch",
    user_id: "demo-user",
    name: "Ahead 2.0 功能预告",
    slug: demoCampaignSlug,
    status: "published",
    draft_config: createCampaignConfig("launch"),
    published_config: createCampaignConfig("launch"),
    subscriber_count: 1842,
    published_at: "2026-08-12T09:00:00.000Z",
    created_at: "2026-08-03T10:00:00.000Z",
    updated_at: "2026-08-12T09:00:00.000Z",
  },
  {
    id: "demo-editorial",
    user_id: "demo-user",
    name: "夏季编辑精选",
    slug: "summer-editorial",
    status: "draft",
    draft_config: {
      ...createCampaignConfig("editorial"),
      title: "为安静的灵感，留一个位置",
      description: "每月一次，分享我们正在打磨的产品、文章与幕后过程。",
      eyebrow: "FIELD NOTES · VOL. 08",
      buttonLabel: "订阅编辑来信",
      themeColor: "#167D70",
    },
    published_config: null,
    subscriber_count: 0,
    published_at: null,
    created_at: "2026-08-10T14:20:00.000Z",
    updated_at: "2026-08-14T08:35:00.000Z",
  },
  {
    id: "demo-signal",
    user_id: "demo-user",
    name: "开发者 API 内测",
    slug: "developer-api-beta",
    status: "published",
    draft_config: {
      ...createCampaignConfig("signal"),
      title: "Build access: opening soon",
      description: "订阅 API 内测名额，优先获取 SDK、文档和测试额度。",
      eyebrow: "STATUS / PRIVATE BETA",
      buttonLabel: "申请内测名额",
      themeColor: "#2657C8",
    },
    published_config: {
      ...createCampaignConfig("signal"),
      title: "Build access: opening soon",
      description: "订阅 API 内测名额，优先获取 SDK、文档和测试额度。",
      eyebrow: "STATUS / PRIVATE BETA",
      buttonLabel: "申请内测名额",
      themeColor: "#2657C8",
    },
    subscriber_count: 326,
    published_at: "2026-08-11T06:00:00.000Z",
    created_at: "2026-08-08T12:00:00.000Z",
    updated_at: "2026-08-14T11:10:00.000Z",
  },
]

const demoSubscribers: Subscriber[] = [
  {
    id: "demo-subscriber-1",
    campaign_id: "demo-launch",
    email: "lin@example.com",
    answers: {
      "first-signal": "协作流程",
      "one-more-thing": "希望跨团队确认不再散落在聊天记录里。",
    },
    created_at: "2026-08-15T08:24:00.000Z",
    analytics: {
      campaignTag: "launch-wave-2",
      city: "上海",
      countryCode: "CN",
      deviceType: "desktop",
      engagementSeconds: 286,
      firstSeenAt: "2026-08-14T13:08:00.000Z",
      interactionCount: 12,
      lastSeenAt: "2026-08-15T08:24:00.000Z",
      locale: "zh-CN",
      maxScrollDepth: 94,
      medium: "social",
      pageViews: 4,
      region: "上海",
      sessions: 2,
      source: "wechat",
      timezone: "Asia/Shanghai",
    },
  },
  {
    id: "demo-subscriber-2",
    campaign_id: "demo-launch",
    email: "product@example.com",
    answers: {
      "first-signal": "发布控制",
    },
    created_at: "2026-08-14T16:42:00.000Z",
    analytics: {
      campaignTag: null,
      city: "北京",
      countryCode: "CN",
      deviceType: "mobile",
      engagementSeconds: 104,
      firstSeenAt: "2026-08-14T16:39:00.000Z",
      interactionCount: 7,
      lastSeenAt: "2026-08-14T16:42:00.000Z",
      locale: "zh-CN",
      maxScrollDepth: 78,
      medium: null,
      pageViews: 2,
      region: "北京",
      sessions: 1,
      source: "direct",
      timezone: "Asia/Shanghai",
    },
  },
  {
    id: "demo-subscriber-3",
    campaign_id: "demo-signal",
    email: "dev@example.com",
    answers: {
      "first-signal": "自动化能力",
      "one-more-thing": "需要更清晰的 API 变更记录。",
    },
    created_at: "2026-08-13T10:12:00.000Z",
    analytics: {
      campaignTag: "api-beta",
      city: "Singapore",
      countryCode: "SG",
      deviceType: "desktop",
      engagementSeconds: 198,
      firstSeenAt: "2026-08-13T10:07:00.000Z",
      interactionCount: 9,
      lastSeenAt: "2026-08-13T10:12:00.000Z",
      locale: "en-SG",
      maxScrollDepth: 88,
      medium: "referral",
      pageViews: 3,
      region: null,
      sessions: 1,
      source: "github.com",
      timezone: "Asia/Singapore",
    },
  },
]

export const getCampaigns = cache(async (): Promise<Campaign[]> => {
  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return demoCampaigns
  }

  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase.rpc("get_campaigns_with_counts")

  if (error) {
    throw new Error(`无法读取订阅项目：${error.message}`)
  }

  return (data ?? []).map((campaign) => ({
    ...campaign,
    draft_config: normalizeCampaignConfig(campaign.draft_config),
    published_config: campaign.published_config
      ? normalizeCampaignConfig(campaign.published_config)
      : null,
  }))
})

export const getCampaignById = cache(async (id: string): Promise<Campaign | null> => {
  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    const campaign = demoCampaigns.find((item) => item.id === id)
    if (!campaign) {
      return null
    }

    return {
      ...campaign,
      draft_config: normalizeCampaignConfig(campaign.draft_config),
      published_config: campaign.published_config
        ? normalizeCampaignConfig(campaign.published_config)
        : null,
    }
  }

  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("subscription_campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    throw new Error(`无法读取项目：${error.message}`)
  }

  if (!data) {
    return null
  }

  return {
    ...data,
    draft_config: normalizeCampaignConfig(data.draft_config),
    published_config: data.published_config ? normalizeCampaignConfig(data.published_config) : null,
    subscriber_count: 0,
  }
})

export const getCampaignSubscribers = cache(async (campaignId: string): Promise<Subscriber[]> => {
  const campaign = await getCampaignById(campaignId)

  if (campaign?.status !== "published") {
    return []
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return demoSubscribers.filter((subscriber) => subscriber.campaign_id === campaignId)
  }

  const user = await getCurrentUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase.rpc("get_campaign_subscribers_with_analytics", {
    p_campaign_id: campaignId,
  })

  if (error) {
    throw new Error(
      error.message.includes("does not exist")
        ? "预约行为分析结构尚未安装，请执行最新 Supabase SQL。"
        : `无法读取预约名单：${error.message}`
    )
  }

  return z.array(subscriberSchema).parse(data ?? [])
})

export const getPublicCampaign = cache(async (slug: string): Promise<PublicCampaign | null> => {
  const demoCampaign = demoCampaigns.find(
    (campaign) => campaign.slug === slug && campaign.status === "published"
  )

  if (slug === demoCampaignSlug) {
    if (!demoCampaign?.published_config || !demoCampaign.published_at) {
      return null
    }

    return {
      id: demoCampaign.id,
      slug: demoCampaign.slug,
      config: normalizeCampaignConfig(demoCampaign.published_config),
      publishedAt: demoCampaign.published_at,
    }
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    if (!demoCampaign?.published_config || !demoCampaign.published_at) {
      return null
    }

    return {
      id: demoCampaign.id,
      slug: demoCampaign.slug,
      config: normalizeCampaignConfig(demoCampaign.published_config),
      publishedAt: demoCampaign.published_at,
    }
  }

  const { data, error } = await supabase.rpc("get_published_campaign", {
    p_slug: slug,
  })

  if (error) {
    throw new Error(`无法读取发布页面：${error.message}`)
  }

  const campaign = data?.[0]

  if (!campaign) {
    return null
  }

  return {
    id: campaign.id,
    slug: campaign.slug,
    config: normalizeCampaignConfig(campaign.published_config),
    publishedAt: campaign.published_at,
  }
})

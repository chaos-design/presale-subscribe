import { cache } from "react"
import { z } from "zod"

import { splitMetric } from "@/lib/analytics-math"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { AnalyticsRange, ProjectAnalytics, TrafficAnalyticsItem } from "@/types/database"

const nonNegativeNumber = z.number().nonnegative()
const trafficItemSchema = z.object({
  label: z.string(),
  pageViews: nonNegativeNumber,
  uniqueVisitors: nonNegativeNumber,
})
const engagementMetricSchema = z.object({
  averageDurationSeconds: nonNegativeNumber,
  averageScrollDepth: nonNegativeNumber,
})
const projectAnalyticsSchema = z.object({
  rangeDays: z.number().int().min(7).max(365),
  periodStart: z.string(),
  totals: z.object({
    publishedCampaigns: nonNegativeNumber,
    pageViews: nonNegativeNumber,
    uniqueVisitors: nonNegativeNumber,
    sessions: nonNegativeNumber,
    applications: nonNegativeNumber,
    conversionRate: nonNegativeNumber,
    returningVisitorRate: nonNegativeNumber,
    pageViewsPerVisitor: nonNegativeNumber,
    allTimePageViews: nonNegativeNumber,
    allTimeUniqueVisitors: nonNegativeNumber,
    allTimeApplications: nonNegativeNumber,
  }),
  daily: z.array(
    z.object({
      date: z.string(),
      pageViews: nonNegativeNumber,
      uniqueVisitors: nonNegativeNumber,
      applications: nonNegativeNumber,
    })
  ),
  campaigns: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      pageViews: nonNegativeNumber,
      uniqueVisitors: nonNegativeNumber,
      sessions: nonNegativeNumber,
      applications: nonNegativeNumber,
      totalApplications: nonNegativeNumber,
      conversionRate: nonNegativeNumber,
    })
  ),
  sources: z.array(trafficItemSchema),
  devices: z.array(trafficItemSchema),
  emailDomains: z.array(
    z.object({
      label: z.string(),
      applications: nonNegativeNumber,
    })
  ),
  questionInsights: z.array(
    z.object({
      campaignId: z.string(),
      campaignName: z.string(),
      questionId: z.string(),
      label: z.string(),
      type: z.enum(["multiple_choice", "short_text", "single_choice"]),
      required: z.boolean(),
      totalApplications: nonNegativeNumber,
      responses: nonNegativeNumber,
      options: z.array(
        z.object({
          label: z.string(),
          selections: nonNegativeNumber,
        })
      ),
    })
  ),
})
const projectBehaviorAnalyticsSchema = z.object({
  totals: z.object({
    averageDurationSeconds: nonNegativeNumber,
    averageScrollDepth: nonNegativeNumber,
    averageInteractions: nonNegativeNumber,
    engagedViewRate: nonNegativeNumber,
  }),
  campaigns: z.array(engagementMetricSchema.extend({ id: z.string() })),
  sources: z.array(engagementMetricSchema.extend({ label: z.string() })),
  devices: z.array(engagementMetricSchema.extend({ label: z.string() })),
  locations: z.array(
    z.object({
      city: z.string().nullable(),
      countryCode: z.string().nullable(),
      region: z.string().nullable(),
      pageViews: nonNegativeNumber,
      uniqueVisitors: nonNegativeNumber,
      averageDurationSeconds: nonNegativeNumber,
    })
  ),
})

function round(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function createDemoWorkspaceAnalytics(days: AnalyticsRange): ProjectAnalytics {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() - (days - index - 1))
    const weekdayFactor = [0.72, 0.96, 1.08, 1.14, 1.04, 0.88, 0.68][date.getUTCDay()]
    const pulse = 1 + ((index * 11) % 9) / 28
    const pageViews = Math.round(118 * weekdayFactor * pulse)
    const uniqueVisitors = Math.round(pageViews * (0.67 + ((index * 7) % 5) / 100))
    const applications = Math.max(2, Math.round(uniqueVisitors * (0.075 + (index % 4) / 100)))

    return {
      date: date.toISOString().slice(0, 10),
      pageViews,
      uniqueVisitors,
      applications,
    }
  })
  const pageViews = daily.reduce((total, item) => total + item.pageViews, 0)
  const uniqueVisitors = daily.reduce((total, item) => total + item.uniqueVisitors, 0)
  const applications = daily.reduce((total, item) => total + item.applications, 0)
  const sessions = Math.round(uniqueVisitors * 1.12)
  const [launchPageViews, signalPageViews] = splitMetric(pageViews, [0.76, 0.24])
  const [launchVisitors, signalVisitors] = splitMetric(uniqueVisitors, [0.74, 0.26])
  const [launchApplications, signalApplications] = splitMetric(applications, [0.7, 0.3])
  const sourceMetrics = splitMetric(pageViews, [0.38, 0.22, 0.16, 0.14, 0.1])
  const sourceVisitors = splitMetric(uniqueVisitors, [0.36, 0.23, 0.17, 0.14, 0.1])
  const deviceMetrics = splitMetric(pageViews, [0.54, 0.34, 0.1, 0.02])
  const deviceVisitors = splitMetric(uniqueVisitors, [0.51, 0.37, 0.1, 0.02])
  const domainMetrics = splitMetric(applications, [0.42, 0.2, 0.15, 0.1, 0.08, 0.05])

  return {
    rangeDays: days,
    periodStart: daily[0]?.date ?? today.toISOString().slice(0, 10),
    totals: {
      publishedCampaigns: 2,
      pageViews,
      uniqueVisitors,
      sessions,
      applications,
      conversionRate: uniqueVisitors > 0 ? round((applications / uniqueVisitors) * 100) : 0,
      returningVisitorRate: 21.8,
      pageViewsPerVisitor: uniqueVisitors > 0 ? round(pageViews / uniqueVisitors, 2) : 0,
      averageDurationSeconds: 96.4,
      averageScrollDepth: 68.7,
      averageInteractions: 5.8,
      engagedViewRate: 72.6,
      allTimePageViews: 28460,
      allTimeUniqueVisitors: 19408,
      allTimeApplications: 2168,
    },
    daily,
    campaigns: [
      {
        id: "demo-launch",
        name: "Ahead 2.0 功能预告",
        slug: "ahead-2-preview",
        pageViews: launchPageViews,
        uniqueVisitors: launchVisitors,
        sessions: Math.round(sessions * 0.74),
        applications: launchApplications,
        totalApplications: 1842,
        conversionRate: launchVisitors > 0 ? round((launchApplications / launchVisitors) * 100) : 0,
        averageDurationSeconds: 104.8,
        averageScrollDepth: 72.3,
      },
      {
        id: "demo-signal",
        name: "开发者 API 内测",
        slug: "developer-api-beta",
        pageViews: signalPageViews,
        uniqueVisitors: signalVisitors,
        sessions: sessions - Math.round(sessions * 0.74),
        applications: signalApplications,
        totalApplications: 326,
        conversionRate: signalVisitors > 0 ? round((signalApplications / signalVisitors) * 100) : 0,
        averageDurationSeconds: 71.2,
        averageScrollDepth: 57.4,
      },
    ],
    sources: ["direct", "wechat", "x.com", "google", "internal"].map((label, index) => ({
      label,
      pageViews: sourceMetrics[index] ?? 0,
      uniqueVisitors: sourceVisitors[index] ?? 0,
      averageDurationSeconds: [74.2, 118.6, 91.4, 82.8, 132.1][index] ?? 0,
      averageScrollDepth: [58.4, 76.2, 69.1, 63.5, 81.3][index] ?? 0,
    })),
    devices: ["mobile", "desktop", "tablet", "unknown"].map((label, index) => ({
      label,
      pageViews: deviceMetrics[index] ?? 0,
      uniqueVisitors: deviceVisitors[index] ?? 0,
      averageDurationSeconds: [86.3, 112.7, 94.2, 38.6][index] ?? 0,
      averageScrollDepth: [65.8, 73.9, 68.1, 29.4][index] ?? 0,
    })),
    locations: [
      {
        countryCode: "CN",
        region: "上海",
        city: "上海",
        pageViews: Math.round(pageViews * 0.31),
        uniqueVisitors: Math.round(uniqueVisitors * 0.29),
        averageDurationSeconds: 112.4,
      },
      {
        countryCode: "CN",
        region: "北京",
        city: "北京",
        pageViews: Math.round(pageViews * 0.24),
        uniqueVisitors: Math.round(uniqueVisitors * 0.25),
        averageDurationSeconds: 98.7,
      },
      {
        countryCode: "CN",
        region: "广东",
        city: "深圳",
        pageViews: Math.round(pageViews * 0.18),
        uniqueVisitors: Math.round(uniqueVisitors * 0.19),
        averageDurationSeconds: 91.8,
      },
      {
        countryCode: "SG",
        region: null,
        city: "Singapore",
        pageViews: Math.round(pageViews * 0.09),
        uniqueVisitors: Math.round(uniqueVisitors * 0.1),
        averageDurationSeconds: 124.5,
      },
    ],
    emailDomains: ["gmail.com", "qq.com", "outlook.com", "163.com", "icloud.com", "其他"].map(
      (label, index) => ({ label, applications: domainMetrics[index] ?? 0 })
    ),
    questionInsights: [
      {
        campaignId: "demo-launch",
        campaignName: "Ahead 2.0 功能预告",
        questionId: "first-signal",
        label: "你最想先看到哪一部分？",
        type: "single_choice",
        required: true,
        totalApplications: launchApplications,
        responses: launchApplications,
        options: [
          { label: "协作流程", selections: Math.round(launchApplications * 0.44) },
          { label: "自动化能力", selections: Math.round(launchApplications * 0.34) },
          { label: "发布控制", selections: Math.round(launchApplications * 0.22) },
        ],
      },
      {
        campaignId: "demo-launch",
        campaignName: "Ahead 2.0 功能预告",
        questionId: "priority-signals",
        label: "哪些信息会帮助你判断是否加入首批体验？",
        type: "multiple_choice",
        required: false,
        totalApplications: launchApplications,
        responses: Math.round(launchApplications * 0.81),
        options: [
          { label: "开放时间", selections: Math.round(launchApplications * 0.63) },
          { label: "功能范围", selections: Math.round(launchApplications * 0.58) },
          { label: "价格计划", selections: Math.round(launchApplications * 0.47) },
          { label: "迁移方式", selections: Math.round(launchApplications * 0.26) },
        ],
      },
      {
        campaignId: "demo-launch",
        campaignName: "Ahead 2.0 功能预告",
        questionId: "one-more-thing",
        label: "还有什么，会让这次更新对你更有价值？",
        type: "short_text",
        required: false,
        totalApplications: launchApplications,
        responses: Math.round(launchApplications * 0.38),
        options: [],
      },
    ],
  }
}

function scaleTrafficItems(
  items: TrafficAnalyticsItem[],
  pageViews: number,
  uniqueVisitors: number
) {
  const totalPageViews = items.reduce((total, item) => total + item.pageViews, 0)
  const totalUniqueVisitors = items.reduce((total, item) => total + item.uniqueVisitors, 0)
  const scaledPageViews = splitMetric(
    pageViews,
    items.map((item) => (totalPageViews > 0 ? item.pageViews / totalPageViews : 0))
  )
  const scaledUniqueVisitors = splitMetric(
    uniqueVisitors,
    items.map((item) => (totalUniqueVisitors > 0 ? item.uniqueVisitors / totalUniqueVisitors : 0))
  )

  return items.map((item, index) => ({
    ...item,
    pageViews: scaledPageViews[index] ?? 0,
    uniqueVisitors: scaledUniqueVisitors[index] ?? 0,
  }))
}

function createDemoAnalytics(days: AnalyticsRange, campaignId: string): ProjectAnalytics {
  const workspace = createDemoWorkspaceAnalytics(days)
  const campaign =
    workspace.campaigns.find((item) => item.id === campaignId) ?? workspace.campaigns[0]

  if (!campaign) {
    return workspace
  }

  const pageViewWeights = workspace.daily.map((item) =>
    workspace.totals.pageViews > 0 ? item.pageViews / workspace.totals.pageViews : 0
  )
  const visitorWeights = workspace.daily.map((item) =>
    workspace.totals.uniqueVisitors > 0 ? item.uniqueVisitors / workspace.totals.uniqueVisitors : 0
  )
  const applicationWeights = workspace.daily.map((item) =>
    workspace.totals.applications > 0 ? item.applications / workspace.totals.applications : 0
  )
  const dailyPageViews = splitMetric(campaign.pageViews, pageViewWeights)
  const dailyVisitors = splitMetric(campaign.uniqueVisitors, visitorWeights)
  const dailyApplications = splitMetric(campaign.applications, applicationWeights)
  const domainApplications = splitMetric(
    campaign.applications,
    workspace.emailDomains.map((item) =>
      workspace.totals.applications > 0 ? item.applications / workspace.totals.applications : 0
    )
  )

  return {
    ...workspace,
    totals: {
      ...workspace.totals,
      publishedCampaigns: 1,
      pageViews: campaign.pageViews,
      uniqueVisitors: campaign.uniqueVisitors,
      sessions: campaign.sessions,
      applications: campaign.applications,
      conversionRate: campaign.conversionRate,
      pageViewsPerVisitor:
        campaign.uniqueVisitors > 0 ? round(campaign.pageViews / campaign.uniqueVisitors, 2) : 0,
      averageDurationSeconds: campaign.averageDurationSeconds,
      averageScrollDepth: campaign.averageScrollDepth,
      allTimePageViews: Math.round(
        workspace.totals.allTimePageViews *
          (campaign.pageViews / Math.max(workspace.totals.pageViews, 1))
      ),
      allTimeUniqueVisitors: Math.round(
        workspace.totals.allTimeUniqueVisitors *
          (campaign.uniqueVisitors / Math.max(workspace.totals.uniqueVisitors, 1))
      ),
      allTimeApplications: campaign.totalApplications,
    },
    daily: workspace.daily.map((item, index) => ({
      ...item,
      pageViews: dailyPageViews[index] ?? 0,
      uniqueVisitors: dailyVisitors[index] ?? 0,
      applications: dailyApplications[index] ?? 0,
    })),
    campaigns: [campaign],
    sources: scaleTrafficItems(workspace.sources, campaign.pageViews, campaign.uniqueVisitors),
    devices: scaleTrafficItems(workspace.devices, campaign.pageViews, campaign.uniqueVisitors),
    locations: workspace.locations.map((item) => ({
      ...item,
      pageViews: Math.round(
        campaign.pageViews * (item.pageViews / Math.max(workspace.totals.pageViews, 1))
      ),
      uniqueVisitors: Math.round(
        campaign.uniqueVisitors *
          (item.uniqueVisitors / Math.max(workspace.totals.uniqueVisitors, 1))
      ),
    })),
    emailDomains: workspace.emailDomains.map((item, index) => ({
      ...item,
      applications: domainApplications[index] ?? 0,
    })),
    questionInsights: workspace.questionInsights.filter(
      (insight) => insight.campaignId === campaign.id
    ),
  }
}

export const getCampaignAnalytics = cache(
  async (campaignId: string, days: AnalyticsRange): Promise<ProjectAnalytics> => {
    const supabase = await createSupabaseServerClient()

    if (!supabase) {
      return createDemoAnalytics(days, campaignId)
    }

    const [{ data, error }, { data: behaviorData, error: behaviorError }] = await Promise.all([
      supabase.rpc("get_campaign_analytics", {
        p_campaign_id: campaignId,
        p_days: days,
      }),
      supabase.rpc("get_campaign_behavior_analytics", {
        p_campaign_id: campaignId,
        p_days: days,
      }),
    ])

    if (error || behaviorError) {
      const message = error?.message ?? behaviorError?.message ?? "Unknown analytics error"
      throw new Error(
        message.includes("does not exist")
          ? "数据分析结构尚未安装，请执行最新 Supabase SQL。"
          : `无法读取数据分析：${message}`
      )
    }

    const analytics = projectAnalyticsSchema.parse(data)
    const behavior = projectBehaviorAnalyticsSchema.parse(behaviorData)
    const campaignBehavior = new Map(behavior.campaigns.map((item) => [item.id, item]))
    const sourceBehavior = new Map(behavior.sources.map((item) => [item.label, item]))
    const deviceBehavior = new Map(behavior.devices.map((item) => [item.label, item]))

    return {
      ...analytics,
      totals: {
        ...analytics.totals,
        ...behavior.totals,
      },
      campaigns: analytics.campaigns.map((campaign) => ({
        ...campaign,
        averageDurationSeconds: campaignBehavior.get(campaign.id)?.averageDurationSeconds ?? 0,
        averageScrollDepth: campaignBehavior.get(campaign.id)?.averageScrollDepth ?? 0,
      })),
      sources: analytics.sources.map((source) => ({
        ...source,
        averageDurationSeconds: sourceBehavior.get(source.label)?.averageDurationSeconds ?? 0,
        averageScrollDepth: sourceBehavior.get(source.label)?.averageScrollDepth ?? 0,
      })),
      devices: analytics.devices.map((device) => ({
        ...device,
        averageDurationSeconds: deviceBehavior.get(device.label)?.averageDurationSeconds ?? 0,
        averageScrollDepth: deviceBehavior.get(device.label)?.averageScrollDepth ?? 0,
      })),
      locations: behavior.locations,
    }
  }
)

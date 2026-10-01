import { NextResponse } from "next/server"

import { formatLocation } from "@/lib/analytics-display"
import { getCampaignById, getCampaignSubscribers } from "@/lib/campaigns"
import { escapeCsvCell } from "@/lib/csv"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaignById(id)

  if (campaign?.status !== "published") {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  const subscribers = await getCampaignSubscribers(id)

  const questions =
    campaign.published_config?.questionnaire.questions ??
    campaign.draft_config.questionnaire.questions
  const questionById = new Map(questions.map((question) => [question.id, question.label]))
  const questionIds = [
    ...new Set([
      ...questions.map((question) => question.id),
      ...subscribers.flatMap((subscriber) => Object.keys(subscriber.answers)),
    ]),
  ]
  const rows = [
    [
      "email",
      "subscribed_at",
      "source",
      "medium",
      "campaign_tag",
      "location",
      "device",
      "engagement_seconds",
      "page_views",
      "sessions",
      "max_scroll_depth",
      "interaction_count",
      "first_seen_at",
      "last_seen_at",
      ...questionIds.map((questionId) => `question:${questionById.get(questionId) ?? questionId}`),
    ],
    ...subscribers.map((subscriber) => {
      const analytics = subscriber.analytics

      return [
        subscriber.email,
        subscriber.created_at,
        analytics?.source ?? "",
        analytics?.medium ?? "",
        analytics?.campaignTag ?? "",
        analytics ? formatLocation(analytics) : "",
        analytics?.deviceType ?? "",
        String(analytics?.engagementSeconds ?? ""),
        String(analytics?.pageViews ?? ""),
        String(analytics?.sessions ?? ""),
        String(analytics?.maxScrollDepth ?? ""),
        String(analytics?.interactionCount ?? ""),
        analytics?.firstSeenAt ?? "",
        analytics?.lastSeenAt ?? "",
        ...questionIds.map((questionId) => {
          const answer = subscriber.answers[questionId]
          return Array.isArray(answer) ? answer.join(" | ") : (answer ?? "")
        }),
      ]
    }),
  ]
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${campaign.slug}-subscribers.csv"`,
      "Cache-Control": "private, no-store",
    },
  })
}

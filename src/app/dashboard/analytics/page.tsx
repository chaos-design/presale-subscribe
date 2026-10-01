import type { Metadata } from "next"
import Link from "next/link"

import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { DashboardMotion } from "@/components/dashboard-motion"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getCampaignAnalytics } from "@/lib/analytics"
import { getCampaigns } from "@/lib/campaigns"
import { type AnalyticsRange, analyticsRangeValues } from "@/types/database"

export const metadata: Metadata = {
  title: "数据分析",
}

function parseAnalyticsRange(value: string | undefined): AnalyticsRange {
  const parsed = Number(value)
  return analyticsRangeValues.includes(parsed as AnalyticsRange) ? (parsed as AnalyticsRange) : 30
}

export default async function DashboardAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; project?: string }>
}) {
  const [query, campaigns] = await Promise.all([searchParams, getCampaigns()])
  const range = parseAnalyticsRange(query.days)
  const publishedCampaigns = campaigns.filter((campaign) => campaign.status === "published")
  const selectedCampaign =
    publishedCampaigns.find((campaign) => campaign.id === query.project) ?? publishedCampaigns[0]

  if (!selectedCampaign) {
    return (
      <DashboardMotion>
        <main className="dashboard-page analytics-page flex flex-col gap-7">
          <header className="dashboard-page-heading">
            <div>
              <p data-eyebrow>PROJECT / RESPONSE INTELLIGENCE</p>
              <h1>项目数据，逐层拆解。</h1>
              <p>发布项目后，这里会显示访问、转化、行为、地域和申请回答明细。</p>
            </div>
          </header>
          <Empty className="min-h-80 bg-card shadow-sm ring-1 ring-foreground/8">
            <EmptyHeader>
              <EmptyTitle>暂无可分析的已发布项目</EmptyTitle>
              <EmptyDescription>草稿没有公开访问数据，请先发布一个项目。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/dashboard/projects" className={buttonVariants()}>
                前往项目库
              </Link>
            </EmptyContent>
          </Empty>
        </main>
      </DashboardMotion>
    )
  }

  const analytics = await getCampaignAnalytics(selectedCampaign.id, range)
  const projectOptions = publishedCampaigns.map(({ id, name, slug }) => ({ id, name, slug }))

  return (
    <DashboardMotion>
      <main className="dashboard-page analytics-page flex flex-col gap-7">
        <AnalyticsDashboard
          analytics={analytics}
          projects={projectOptions}
          range={range}
          selectedProject={{
            id: selectedCampaign.id,
            name: selectedCampaign.name,
            slug: selectedCampaign.slug,
          }}
        />
      </main>
    </DashboardMotion>
  )
}

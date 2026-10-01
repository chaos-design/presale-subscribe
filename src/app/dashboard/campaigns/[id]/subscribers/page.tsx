import { ArrowLeftIcon, CircleAlertIcon, ExternalLinkIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { SubscriberManagement } from "@/components/subscriber-management"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getCampaignById, getCampaignSubscribers } from "@/lib/campaigns"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "预约名单",
}

export default async function CampaignSubscribersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const [campaign, query] = await Promise.all([getCampaignById(id), searchParams])

  if (campaign?.status !== "published") {
    notFound()
  }

  const subscribers = await getCampaignSubscribers(id)

  return (
    <main className="dashboard-page flex max-w-6xl flex-col gap-9">
      <header className="dashboard-page-heading">
        <div>
          <Link
            href="/dashboard/projects"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 mb-3")}
          >
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            返回项目
          </Link>
          <p data-eyebrow>CAMPAIGN / PUBLISHED RESPONSE</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">{campaign.name}</h1>
            <Badge>已发布</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            管理通过 `/p/{campaign.slug}` 收集的预约、来源、地域、参与行为与问卷回答。
          </p>
        </div>
        <Link
          href={`/p/${campaign.slug}`}
          target="_blank"
          className={buttonVariants({ variant: "outline" })}
        >
          <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
          打开分享页
        </Link>
      </header>

      {query.error ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>操作未完成</AlertTitle>
          <AlertDescription>{decodeURIComponent(query.error)}</AlertDescription>
        </Alert>
      ) : null}

      <SubscriberManagement
        campaignId={campaign.id}
        questions={
          campaign.published_config?.questionnaire.questions ??
          campaign.draft_config.questionnaire.questions
        }
        subscribers={subscribers}
      />
    </main>
  )
}

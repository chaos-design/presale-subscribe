import {
  ArrowRightIcon,
  CircleAlertIcon,
  FolderKanbanIcon,
  MailCheckIcon,
  PlusIcon,
  SendIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { CampaignTemplateThumbnail } from "@/components/campaign-template-thumbnail"
import { DashboardMotion } from "@/components/dashboard-motion"
import { DashboardProjectList } from "@/components/dashboard-project-list"
import { DashboardTemplateShowcase } from "@/components/dashboard-template-showcase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { createCampaignConfig, templateOptions } from "@/lib/campaign-presets"
import { getCampaigns } from "@/lib/campaigns"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "工作台总览",
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [campaigns, params] = await Promise.all([getCampaigns(), searchParams])
  const publishedCampaigns = campaigns.filter((campaign) => campaign.status === "published")
  const subscriberCount = publishedCampaigns.reduce(
    (total, campaign) => total + Number(campaign.subscriber_count),
    0
  )
  const rankedCampaigns = [...publishedCampaigns]
    .sort((left, right) => right.subscriber_count - left.subscriber_count)
    .slice(0, 4)
  const highestSubscriberCount = rankedCampaigns[0]?.subscriber_count ?? 0
  return (
    <DashboardMotion>
      <main className="dashboard-page flex flex-col gap-16">
        <header className="dashboard-page-heading">
          <div>
            <p data-eyebrow>WORKSPACE / RELEASE DESK</p>
            <h1>每一次发布，都从这里进入稳定轨道。</h1>
            <p>管理草稿、发布快照与已上线项目的预约反馈。草稿不会产生预约名单。</p>
          </div>
          <Link href="/dashboard/new" className={cn(buttonVariants({ size: "lg" }), "shrink-0")}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            创建项目
          </Link>
        </header>

        {params.error ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>操作未完成</AlertTitle>
            <AlertDescription>{decodeURIComponent(params.error)}</AlertDescription>
          </Alert>
        ) : null}

        <dl className="dashboard-metrics">
          <div>
            <span>01</span>
            <dt>全部项目</dt>
            <dd>{String(campaigns.length).padStart(2, "0")}</dd>
            <FolderKanbanIcon aria-hidden="true" />
          </div>
          <div>
            <span>02</span>
            <dt>已发布快照</dt>
            <dd>{String(publishedCampaigns.length).padStart(2, "0")}</dd>
            <SendIcon aria-hidden="true" />
          </div>
          <div>
            <span>03</span>
            <dt>累计有效预约</dt>
            <dd>{subscriberCount.toLocaleString("zh-CN")}</dd>
            <MailCheckIcon aria-hidden="true" />
          </div>
        </dl>

        {campaigns.length === 0 ? (
          <Empty className="min-h-96 bg-card shadow-sm ring-1 ring-foreground/8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderKanbanIcon />
              </EmptyMedia>
              <EmptyTitle>创建你的第一个项目</EmptyTitle>
              <EmptyDescription>选择完整页面模板，编辑内容并发布稳定快照。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="sm:max-w-md sm:flex-row sm:justify-center">
              <Link href="/dashboard/new" className={buttonVariants()}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                创建项目
              </Link>
              <Link href="/dashboard/templates" className={buttonVariants({ variant: "outline" })}>
                浏览模板
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <section aria-labelledby="recent-projects-title">
            <header className="dashboard-section-heading">
              <div>
                <h2 id="recent-projects-title">最近项目</h2>
                <p>从草稿到线上快照，状态与下一步始终清楚。</p>
              </div>
              <Link
                href="/dashboard/projects"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                全部项目
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </header>
            <DashboardProjectList campaigns={campaigns.slice(0, 6)} />
          </section>
        )}

        {publishedCampaigns.length > 0 ? (
          <section className="dashboard-performance" aria-labelledby="performance-title">
            <header className="dashboard-performance-header">
              <div>
                <h2 id="performance-title">预约表现只属于已发布页面。</h2>
                <span>草稿没有公开入口，也不会出现预约名单。这里按累计预约数量展示线上项目。</span>
              </div>
              <Link href="/dashboard/analytics" className={buttonVariants({ variant: "outline" })}>
                查看完整数据分析
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
            </header>
            <ol>
              {rankedCampaigns.map((campaign, index) => {
                const ratio =
                  highestSubscriberCount > 0
                    ? (campaign.subscriber_count / highestSubscriberCount) * 100
                    : 0

                return (
                  <li key={campaign.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <Link href={`/dashboard/campaigns/${campaign.id}/subscribers`}>
                        {campaign.name}
                      </Link>
                      <i>
                        <b style={{ width: `${Math.max(ratio, ratio > 0 ? 4 : 0)}%` }} />
                      </i>
                    </div>
                    <strong>{campaign.subscriber_count.toLocaleString("zh-CN")}</strong>
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}

        <section aria-labelledby="starter-templates-title">
          <header className="dashboard-section-heading">
            <div>
              <h2 id="starter-templates-title">完整页面模板</h2>
              <p>每套预览都包含首屏、亮点、发布节奏与预约，不再是单屏海报。</p>
            </div>
            <Link
              href="/dashboard/templates"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              全部 {templateOptions.length} 套
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </header>
          <DashboardTemplateShowcase templateCount={templateOptions.length}>
            {templateOptions.map((template) => (
              <article key={template.value}>
                <div>
                  <span>{template.code}</span>
                  <h3>{template.label}</h3>
                  <p>{template.description}</p>
                </div>
                <CampaignTemplateThumbnail
                  config={createCampaignConfig(template.value)}
                  label={template.label}
                />
                <Link
                  href={`/dashboard/new?template=${template.value}`}
                  className={buttonVariants({ variant: "ghost" })}
                >
                  使用此模板
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </DashboardTemplateShowcase>
        </section>
      </main>
    </DashboardMotion>
  )
}

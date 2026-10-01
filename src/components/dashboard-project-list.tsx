import {
  ArrowRightIcon,
  MailCheckIcon,
  PanelsTopLeftIcon,
  PencilLineIcon,
  PlusIcon,
  SendIcon,
} from "lucide-react"
import Link from "next/link"

import { CampaignActionsMenu } from "@/components/campaign-actions-menu"
import { CampaignTemplateThumbnail } from "@/components/campaign-template-thumbnail"
import { DashboardProjectCard } from "@/components/dashboard-project-card"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { templateOptions } from "@/lib/campaign-presets"
import type { Campaign } from "@/types/database"

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const templateByValue = new Map(templateOptions.map((template) => [template.value, template]))

function hasUnpublishedChanges(campaign: Campaign) {
  return (
    campaign.status === "published" &&
    Boolean(campaign.published_config) &&
    JSON.stringify(campaign.draft_config) !== JSON.stringify(campaign.published_config)
  )
}

function getDisplayConfig(campaign: Campaign) {
  return campaign.status === "published" && campaign.published_config
    ? campaign.published_config
    : campaign.draft_config
}

function ProjectVisual({ campaign }: { campaign: Campaign }) {
  const config = getDisplayConfig(campaign)
  const previewConfig = {
    ...config,
    coverImage: "",
    previewVideo: {
      ...config.previewVideo,
      posterUrl: "",
      url: "",
    },
  }

  return (
    <div className="dashboard-project-visual">
      <CampaignTemplateThumbnail
        config={previewConfig}
        label={campaign.name}
        className="dashboard-project-template-thumbnail"
        compact
        decorative
      />
    </div>
  )
}

export function DashboardProjectList({
  campaigns,
  emptyDescription = "创建项目后，就可以在这里管理草稿、发布页面和预约名单。",
}: {
  campaigns: Campaign[]
  emptyDescription?: string
}) {
  if (campaigns.length === 0) {
    return (
      <Empty className="min-h-80 bg-card shadow-sm ring-1 ring-foreground/8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PanelsTopLeftIcon />
          </EmptyMedia>
          <EmptyTitle>还没有项目</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/dashboard/new" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            创建项目
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="dashboard-project-grid">
      {campaigns.map((campaign) => {
        const displayConfig = getDisplayConfig(campaign)
        const template = templateByValue.get(displayConfig.template)
        const isPublished = campaign.status === "published"
        const hasDraftChanges = hasUnpublishedChanges(campaign)
        const statusTime = isPublished
          ? (campaign.published_at ?? campaign.updated_at)
          : campaign.updated_at
        const cardHref = isPublished
          ? `/dashboard/campaigns/${campaign.id}/subscribers`
          : `/dashboard/campaigns/${campaign.id}/edit`

        return (
          <DashboardProjectCard
            key={campaign.id}
            href={cardHref}
            published={isPublished}
            draftDirty={hasDraftChanges}
          >
            <header>
              <span>
                <i />
                {isPublished ? (hasDraftChanges ? "已发布 / 草稿未发布" : "已发布") : "草稿"}
              </span>
              <CampaignActionsMenu
                campaignId={campaign.id}
                campaignName={campaign.name}
                slug={campaign.slug}
                status={campaign.status}
              />
            </header>

            <ProjectVisual campaign={campaign} />

            <div className="dashboard-project-body">
              <span>
                {template?.code} / {template?.label}
              </span>
              <h3>{campaign.name}</h3>
              <p>{isPublished ? `/p/${campaign.slug}` : "保存草稿，发布后生成预约页"}</p>
              {hasDraftChanges ? (
                <em className="dashboard-project-version-note">
                  线上页仍显示上次发布内容，发布后替换为当前草稿。
                </em>
              ) : null}
            </div>

            <dl>
              <div>
                <dt>{isPublished ? "线上发布" : "最近更新"}</dt>
                <dd>{dateFormatter.format(new Date(statusTime))}</dd>
              </div>
              <div>
                <dt>{isPublished ? "预约人数" : "预约名单"}</dt>
                <dd>
                  {isPublished ? (
                    <span>
                      <MailCheckIcon aria-hidden="true" />
                      {campaign.subscriber_count.toLocaleString("zh-CN")}
                    </span>
                  ) : (
                    <span>发布后开放</span>
                  )}
                </dd>
              </div>
            </dl>

            <footer>
              <Link
                href={`/dashboard/campaigns/${campaign.id}/edit`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <PencilLineIcon data-icon="inline-start" aria-hidden="true" />
                编辑
              </Link>
              {isPublished ? (
                <Link
                  href={`/p/${campaign.slug}`}
                  target="_blank"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  查看线上页
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              ) : (
                <span className="dashboard-project-draft-note">
                  <SendIcon aria-hidden="true" />
                  发布后可分享和收集预约
                </span>
              )}
            </footer>
          </DashboardProjectCard>
        )
      })}
    </div>
  )
}

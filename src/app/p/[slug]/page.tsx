import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageViewTracker } from "@/components/page-view-tracker"
import { PublicCampaignExperience } from "@/components/public-campaign-experience"
import { PublicCampaignMotion } from "@/components/public-campaign-motion"
import { getPublicCampaign } from "@/lib/campaigns"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const campaign = await getPublicCampaign(slug)

  if (!campaign) {
    return { title: "订阅页面不存在" }
  }

  return {
    title: campaign.config.title,
    description: campaign.config.description,
    openGraph: {
      title: campaign.config.title,
      description: campaign.config.description,
      images: campaign.config.coverImage ? [{ url: campaign.config.coverImage }] : undefined,
    },
  }
}

export default async function PublicCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = await getPublicCampaign(slug)

  if (!campaign) {
    notFound()
  }

  return (
    <PublicCampaignMotion>
      <PageViewTracker slug={campaign.slug} />
      <PublicCampaignExperience campaign={campaign} />
    </PublicCampaignMotion>
  )
}

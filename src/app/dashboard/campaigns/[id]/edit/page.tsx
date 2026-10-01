import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CampaignEditor } from "@/components/campaign-editor"
import { getCampaignById } from "@/lib/campaigns"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const campaign = await getCampaignById(id)

  return {
    title: campaign ? `配置 ${campaign.name}` : "项目不存在",
  }
}

export default async function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaignById(id)

  if (!campaign) {
    notFound()
  }

  return <CampaignEditor campaign={campaign} />
}

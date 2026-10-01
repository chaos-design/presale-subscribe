import { PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { DashboardProjectList } from "@/components/dashboard-project-list"
import { buttonVariants } from "@/components/ui/button"
import { getCampaigns } from "@/lib/campaigns"

export const metadata: Metadata = {
  title: "项目管理",
}

export default async function DashboardProjectsPage() {
  const campaigns = await getCampaigns()

  return (
    <main className="dashboard-page flex flex-col gap-12">
      <header className="dashboard-page-heading">
        <div>
          <p data-eyebrow>WORKSPACE / PROJECT LIBRARY</p>
          <h1>项目库</h1>
          <p>草稿用于持续编辑；发布后才会生成公开页面、稳定分享地址与预约名单。</p>
        </div>
        <Link href="/dashboard/new" className={buttonVariants({ size: "lg" })}>
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
          创建项目
        </Link>
      </header>

      <DashboardProjectList campaigns={campaigns} />
    </main>
  )
}

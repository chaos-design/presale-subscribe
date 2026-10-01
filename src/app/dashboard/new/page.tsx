import { CircleAlertIcon } from "lucide-react"
import type { Metadata } from "next"

import { NewCampaignForm } from "@/components/new-campaign-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { type CampaignTemplate, campaignTemplateValues } from "@/types/database"

export const metadata: Metadata = {
  title: "创建项目",
}

function isCampaignTemplate(value: string | undefined): value is CampaignTemplate {
  return campaignTemplateValues.some((template) => template === value)
}

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; template?: string }>
}) {
  const query = await searchParams
  const initialTemplate = isCampaignTemplate(query.template) ? query.template : "launch"

  return (
    <main className="dashboard-page new-campaign-page flex flex-col">
      <header className="dashboard-page-heading new-campaign-page-heading">
        <div>
          <p data-eyebrow>WORKSPACE / NEW PROJECT</p>
          <h1>创建项目</h1>
          <p>填写项目名称，选择一套完整页面配置，然后进入内容编辑。</p>
        </div>
      </header>

      {query.error ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>无法创建项目</AlertTitle>
          <AlertDescription>
            {query.error === "invalid-project"
              ? "请填写至少 2 个字符的项目名称。"
              : decodeURIComponent(query.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <NewCampaignForm initialTemplate={initialTemplate} />
    </main>
  )
}

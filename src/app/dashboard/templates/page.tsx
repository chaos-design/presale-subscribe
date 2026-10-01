import { ArrowRightIcon, LayoutTemplateIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { CampaignTemplateThumbnail } from "@/components/campaign-template-thumbnail"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { createCampaignConfig, templateOptions } from "@/lib/campaign-presets"

export const metadata: Metadata = {
  title: "模板库",
}

const templateCategories = ["产品发布", "品牌叙事", "实验视觉", "专业服务"] as const

export default function DashboardTemplatesPage() {
  return (
    <main className="dashboard-page flex flex-col gap-20">
      <header className="dashboard-page-heading">
        <div>
          <p data-eyebrow>WORKSPACE / PAGE SYSTEMS</p>
          <h1>完整页面模板库</h1>
          <p>每套模板都由独立视觉方案与完整内容配置驱动，预览包含首屏、亮点、发布节奏和预约。</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          <LayoutTemplateIcon data-icon="inline-start" aria-hidden="true" />
          {templateOptions.length} 套可用
        </Badge>
      </header>

      {templateCategories.map((category, categoryIndex) => {
        const templates = templateOptions.filter((template) => template.category === category)

        return (
          <section key={category} aria-labelledby={`template-category-${category}`}>
            <header className="dashboard-section-heading">
              <div>
                <h2 id={`template-category-${category}`}>{category}</h2>
                <p>{templates.length} 套长页面系统</p>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {String(categoryIndex + 1).padStart(2, "0")} /{" "}
                {String(templateCategories.length).padStart(2, "0")}
              </span>
            </header>

            <div className="dashboard-template-library">
              {templates.map((template) => (
                <article key={template.value}>
                  <header>
                    <div>
                      <span>{template.code}</span>
                      <h3>{template.label}</h3>
                      <p>{template.description}</p>
                    </div>
                    <Badge variant="secondary">{template.category}</Badge>
                  </header>
                  <CampaignTemplateThumbnail
                    config={createCampaignConfig(template.value)}
                    label={template.label}
                  />
                  <footer>
                    <span>FULL PAGE / RESPONSIVE / DATA DRIVEN</span>
                    <Link
                      href={`/dashboard/new?template=${template.value}`}
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      使用此模板
                      <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}

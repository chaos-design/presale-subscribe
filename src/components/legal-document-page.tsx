import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"

export interface LegalSection {
  id: string
  title: string
  paragraphs?: readonly string[]
  items?: readonly string[]
}

export function LegalDocumentPage({
  documentType,
  eyebrow,
  title,
  summary,
  sections,
}: {
  documentType: "terms" | "privacy"
  eyebrow: string
  title: string
  summary: string
  sections: readonly LegalSection[]
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-5 px-4 sm:px-7">
          <BrandMark />
          <nav className="flex h-16 items-center gap-5 text-sm" aria-label="法律文档">
            <Link
              href="/terms"
              className={
                documentType === "terms" ? "font-semibold text-foreground" : "text-muted-foreground"
              }
              aria-current={documentType === "terms" ? "page" : undefined}
            >
              服务条款
            </Link>
            <Link
              href="/privacy"
              className={
                documentType === "privacy"
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }
              aria-current={documentType === "privacy" ? "page" : undefined}
            >
              隐私政策
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-7">
        <header className="border-b py-14 sm:py-20">
          <p className="font-mono text-[10px] uppercase text-primary">{eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {summary}
          </p>
          <dl className="mt-8 flex flex-wrap gap-8 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">生效日期</dt>
              <dd className="mt-1 font-medium">2026 年</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">适用产品</dt>
              <dd className="mt-1 font-medium">REPS</dd>
            </div>
          </dl>
        </header>

        <article>
          {sections.map((section, index) => (
            <section
              id={section.id}
              key={section.id}
              className="grid gap-3 border-b py-10 sm:grid-cols-[3rem_1fr]"
            >
              <span className="font-mono text-[10px] text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.items ? (
                    <ul className="flex list-disc flex-col gap-2 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>
          ))}
        </article>

        <footer className="flex flex-col justify-between gap-5 py-10 sm:flex-row sm:items-center">
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            第三方自行部署 REPS 时，应根据实际主体、地区、基础设施和处理活动补充必要信息。
          </p>
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            返回登录
          </Button>
        </footer>
      </main>
    </div>
  )
}

import {
  ArrowRightIcon,
  CheckIcon,
  Layers3Icon,
  MailCheckIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react"
import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { GithubMark } from "@/components/github-mark"
import { HomeMotion } from "@/components/home-motion"
import { PageSystemsCarousel } from "@/components/page-systems-carousel"
import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser, isDemoMode } from "@/lib/auth"
import { demoCampaignSlug } from "@/lib/campaigns"
import { productConfig } from "@/lib/product-config"
import { cn } from "@/lib/utils"

const workflow = [
  {
    icon: Layers3Icon,
    stage: "TEASE",
    title: "先把值得期待的变化说清楚",
    description: "用一页完整预告交代正在发生什么、它为何重要，以及下一步何时到来。",
  },
  {
    icon: SendIcon,
    stage: "RELEASE",
    title: "在准备好的时刻发出信号",
    description: "确认内容后再更新公开页面，已经分享出去的地址始终指向你认可的版本。",
  },
  {
    icon: MailCheckIcon,
    stage: "LISTEN",
    title: "让兴趣留下可行动的线索",
    description: "访客用邮箱和简短回答表达期待，你据此判断首批开放该交给谁。",
  },
] as const

export default async function HomePage() {
  const user = await getCurrentUser()
  const demoMode = isDemoMode()
  const dashboardLabel = user ? "进入工作台" : demoMode ? "查看演示工作台" : "登录"
  const dashboardHref = user || demoMode ? "/dashboard" : "/login"

  return (
    <HomeMotion>
      <section className="home-hero relative isolate h-[min(780px,calc(100svh-2rem))] min-h-[660px] overflow-hidden bg-[#080a09] text-white">
        <div className="app-grid absolute inset-0 opacity-15" aria-hidden="true" />
        <div
          className="absolute inset-y-0 left-[11%] border-l border-white/10"
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-[11%] border-r border-white/10"
          aria-hidden="true"
        />
        <div className="home-signal-sweep" aria-hidden="true" />
        <div className="home-orbit-stage" data-home-hero="orbit" aria-hidden="true">
          <div className="home-orbit home-orbit-outer">
            <i />
          </div>
          <div className="home-orbit home-orbit-middle">
            <i />
          </div>
          <div className="home-orbit home-orbit-inner">
            <i />
          </div>
          <div className="home-target">
            <span>RELEASE</span>
            <strong>01</strong>
            <span>LOCKED</span>
          </div>
          <div className="home-vector home-vector-x" />
          <div className="home-vector home-vector-y" />
        </div>

        <header className="home-command-nav relative z-10" data-home-hero="nav">
          <div className="home-command-brand">
            <BrandMark className="text-white" />
            <span className="home-command-divider" aria-hidden="true" />
            <span className="home-command-kicker">Release intelligence</span>
          </div>
          <div className="home-command-readout" aria-hidden="true">
            <span>01</span>
            <i className="home-status-dot" />
            <span>PUBLIC SIGNAL</span>
            <strong>READY</strong>
          </div>
          <nav className="home-command-actions" aria-label="主导航">
            <Link
              href={`/p/${demoCampaignSlug}`}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "home-command-preview hidden text-white sm:inline-flex"
              )}
            >
              查看线上示例
            </Link>
            <Link
              href={dashboardHref}
              className={cn(buttonVariants({ variant: "secondary" }), "home-command-primary")}
            >
              {dashboardLabel}
              <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </nav>
        </header>

        <div className="home-hero-frame relative z-10 mx-auto flex max-w-[1600px] flex-col px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <div className="home-hero-readout" data-home-hero="meta">
            <div>
              <span className="block text-white/80">AHEAD / BEFORE THE RELEASE</span>
              <span className="mt-1 block">NEXT SIGNAL · READY WHEN YOU ARE</span>
            </div>
            <span className="hidden items-center gap-2 sm:flex">
              <i className="home-status-dot size-1.5 rounded-full bg-[#C6FF3E]" />
              PUBLIC SIGNAL READY
            </span>
          </div>

          <div className="home-hero-content mt-auto max-w-6xl pb-3" data-home-hero="content">
            <div className="home-hero-kicker">
              <span>01</span>
              <i aria-hidden="true" />
              <span>ANNOUNCE / ATTRACT / LISTEN</span>
            </div>
            <h1 className="home-hero-title font-display">
              Ahead
              <span aria-hidden="true">/ 01</span>
            </h1>
            <div className="home-hero-summary">
              <div>
                <p className="max-w-2xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
                  给还没发布的下一步，一个可以被看见、被期待、被记住的入口。等时机成熟，再把准确的信号交给真正关心它的人。
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
                  <span className="flex items-center gap-2">
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                    一页说清变化
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                    只发布准备好的版本
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                    让真实兴趣留下来
                  </span>
                </div>
              </div>
              <div>
                <Link
                  href="#page-systems"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" }),
                    "home-hero-action"
                  )}
                >
                  浏览预告样式
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-7 lg:px-10 lg:py-28" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-7xl">
          <header
            className="grid gap-5 border-b pb-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
            data-home-reveal
          >
            <div>
              <p className="font-mono text-[10px] uppercase text-primary">01 / BEFORE RELEASE</p>
              <h2 id="workflow-title" className="mt-3 max-w-lg text-3xl font-semibold sm:text-5xl">
                正式发布之前，先让期待有地方发生
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:justify-self-end">
              一次好的预告不只是“即将上线”。它让变化被理解，让时间点被记住，也让你在开放之前听见真实需求。
            </p>
          </header>

          <div className="grid lg:grid-cols-3">
            {workflow.map((item, index) => {
              const Icon = item.icon

              return (
                <article
                  key={item.title}
                  className="min-h-72 border-b py-8 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
                  data-home-reveal
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      0{index + 1} / {item.stage}
                    </span>
                  </div>
                  <h3 className="mt-20 max-w-xs text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="page-systems"
        className="bg-foreground px-4 py-20 text-background sm:px-7 lg:px-10 lg:py-28"
        aria-labelledby="templates-title"
      >
        <div className="mx-auto max-w-7xl">
          <header
            className="flex flex-col justify-between gap-6 border-b border-background/20 pb-8 md:flex-row md:items-end"
            data-home-reveal
          >
            <div>
              <p className="font-mono text-[10px] uppercase text-background/55">02 / EXPRESSION</p>
              <h2
                id="templates-title"
                className="mt-3 max-w-2xl text-3xl font-semibold sm:text-5xl"
              >
                让预告拥有准确的气质
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-background/60">
              克制、锋利、明亮或沉浸。选择最接近这次发布的表达，再把内容变成一封值得等待的邀请。
            </p>
          </header>

          <div data-home-reveal>
            <PageSystemsCarousel />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-7 lg:px-10 lg:py-28">
        <div
          className="mx-auto grid max-w-7xl gap-8 py-12 lg:grid-cols-[1fr_auto] lg:items-end"
          data-home-reveal
        >
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheckIcon className="size-4" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase">PUBLISHED SNAPSHOT READY</span>
            </div>
            <h2 className="mt-4 max-w-3xl font-display text-5xl leading-[0.92] sm:text-7xl">
              别等到上线那天，才第一次让人看见它。
            </h2>
          </div>
          <Link href={`/p/${demoCampaignSlug}`} className={buttonVariants({ size: "lg" })}>
            查看已发布示例
            <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer data-home-footer="product" className="home-site-footer">
        <div className="app-grid home-site-footer-grid" aria-hidden="true" />
        <div className="home-site-footer-inner">
          <div className="home-site-footer-masthead home-footer-reveal">
            <div className="home-site-footer-status">
              <i className="home-status-dot" aria-hidden="true" />
              <span>NEXT SIGNAL / OPEN</span>
            </div>
            <p>Make what&apos;s next worth waiting for.</p>
            <strong>{productConfig.wordmark}</strong>
          </div>

          <div className="home-site-footer-baseline home-footer-reveal">
            <div className="home-site-footer-credit">
              <BrandMark className="text-white" />
              <span className="home-site-footer-divider" aria-hidden="true" />
              <div>
                <p>{productConfig.productCredit.label}</p>
                <span>{productConfig.productCredit.description}</span>
              </div>
            </div>

            <nav className="home-site-footer-links" aria-label="页脚导航">
              <Link href="/terms">使用条款</Link>
              <Link href="/privacy">隐私政策</Link>
            </nav>

            <div className="home-site-footer-actions">
              <span>{productConfig.productCredit.year}</span>
              <a
                href={productConfig.productCredit.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`在 GitHub 上查看 ${productConfig.name}`}
                title={`在 GitHub 上查看 ${productConfig.name}`}
              >
                <GithubMark />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </HomeMotion>
  )
}

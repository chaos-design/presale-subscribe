import { ArrowLeftIcon, InfoIcon, KeyRoundIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import { LoginForm } from "@/components/login-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser, isDemoMode } from "@/lib/auth"
import { sanitizeRedirectPath } from "@/lib/redirect-path"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "登录",
  description: "登录 REPS 管理你的功能预告与订阅者。",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[]
    method?: string | string[]
    mode?: string | string[]
    next?: string | string[]
  }>
}) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams])
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next
  const nextPath = sanitizeRedirectPath(rawNext)
  const error = Array.isArray(query.error) ? query.error[0] : query.error
  const method = Array.isArray(query.method) ? query.method[0] : query.method
  const mode = Array.isArray(query.mode) ? query.mode[0] : query.mode

  if (user) {
    redirect(nextPath)
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="home-hero relative hidden min-h-screen overflow-hidden bg-[#080a09] lg:block">
        <div className="app-grid absolute inset-0 opacity-15" aria-hidden="true" />
        <div className="home-signal-sweep" aria-hidden="true" />
        <div className="home-key-visual" aria-hidden="true">
          {/* biome-ignore lint/performance/noImgElement: the key visual self-animates and must stay an SVG asset */}
          <img src="/brand/reps-key-visual.svg" alt="" width={900} height={900} />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
          <BrandMark className="text-white" />
          <blockquote className="max-w-xl">
            <p className="font-display text-5xl leading-[0.96]">
              “发布不是最后一步，它是期待被兑现的那一刻。”
            </p>
            <footer className="mt-6 font-mono text-[11px] uppercase text-white/65">
              REPS publishing notes
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="app-grid flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <BrandMark className="lg:hidden" />
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            返回首页
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <KeyRoundIcon aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl">进入 REPS</CardTitle>
                  <CardDescription className="mt-1">
                    使用账号密码登录，新账号需完成邮箱确认。
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {isDemoMode() ? (
                <Alert>
                  <InfoIcon />
                  <AlertTitle>当前为演示模式</AlertTitle>
                  <AlertDescription>
                    尚未配置 Supabase。你可以直接进入含示例数据的工作台。
                  </AlertDescription>
                  <Link
                    href="/dashboard"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                  >
                    进入演示工作台
                  </Link>
                </Alert>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <InfoIcon />
                  <AlertTitle>认证未完成</AlertTitle>
                  <AlertDescription>确认链接无效或已过期，请重新注册或登录。</AlertDescription>
                </Alert>
              ) : null}

              <LoginForm
                nextPath={nextPath}
                initialLoginMethod={method === "otp" ? "otp" : "password"}
                initialView={mode === "register" ? "register" : "login"}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

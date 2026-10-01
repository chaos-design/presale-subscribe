import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { sanitizeRedirectPath } from "@/lib/redirect-path"

export const metadata: Metadata = {
  title: "找回密码",
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const query = await searchParams
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next
  const nextPath = sanitizeRedirectPath(rawNext)

  return (
    <main className="app-grid flex min-h-screen flex-col px-4 py-6 sm:px-7">
      <header className="flex items-center justify-between">
        <BrandMark />
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href={`/login?next=${encodeURIComponent(nextPath)}`} />}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          返回登录
        </Button>
      </header>
      <div className="grid flex-1 place-items-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>找回密码</CardTitle>
            <CardDescription>输入已注册邮箱以获取安全的密码重置链接。</CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm nextPath={nextPath} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

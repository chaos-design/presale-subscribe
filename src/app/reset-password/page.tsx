import type { Metadata } from "next"
import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { ResetPasswordForm } from "@/components/reset-password-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { sanitizeRedirectPath } from "@/lib/redirect-path"

export const metadata: Metadata = {
  title: "设置新密码",
}

export default async function ResetPasswordPage({
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
        <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
          产品首页
        </Button>
      </header>
      <div className="grid flex-1 place-items-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>设置新密码</CardTitle>
            <CardDescription>输入两次新密码，更新后将返回原工作页面。</CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm nextPath={nextPath} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

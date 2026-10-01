import { ShieldCheckIcon } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccountForm } from "@/components/account-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser, getDemoUser, isDemoMode } from "@/lib/auth"

export const metadata: Metadata = {
  title: "账号设置",
}

export default async function AccountPage() {
  const authenticatedUser = await getCurrentUser()

  if (!authenticatedUser && !isDemoMode()) {
    redirect("/login?next=/dashboard/account")
  }

  const user = authenticatedUser ?? getDemoUser()

  return (
    <main className="dashboard-page flex max-w-5xl flex-col gap-12">
      <header className="dashboard-page-heading">
        <div>
          <p data-eyebrow>WORKSPACE / ACCOUNT</p>
          <h1>账号设置</h1>
          <p>维护工作台中使用的账号资料与登录身份。</p>
        </div>
        <div>
          <Badge variant="outline">
            <ShieldCheckIcon data-icon="inline-start" aria-hidden="true" />
            密码与验证码
          </Badge>
        </div>
      </header>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
          <CardDescription>
            登录邮箱由 Supabase Auth 管理，显示名称保存在用户资料表。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountForm email={user.email} initialName={user.name} />
        </CardContent>
      </Card>
    </main>
  )
}

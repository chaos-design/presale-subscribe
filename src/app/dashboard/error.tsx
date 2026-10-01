"use client"

import { CircleAlertIcon, RotateCcwIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-2xl items-center px-4">
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>工作台加载失败</AlertTitle>
        <AlertDescription>{error.message || "请检查网络与 Supabase 配置。"}</AlertDescription>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
          重试
        </Button>
      </Alert>
    </main>
  )
}

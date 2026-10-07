import { ArrowLeftIcon, FileQuestionIcon } from "lucide-react"
import Link from "next/link"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <main className="app-grid flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-4 sm:px-8">
        <BrandMark />
      </header>
      <div className="flex flex-1 items-center justify-center px-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileQuestionIcon />
            </EmptyMedia>
            <EmptyTitle>页面不存在或已撤回</EmptyTitle>
            <EmptyDescription>检查链接是否正确，或返回 REPS 首页。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/" />}>
              <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
              返回首页
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  )
}

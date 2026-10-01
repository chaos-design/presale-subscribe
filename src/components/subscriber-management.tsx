"use client"

import {
  Clock3Icon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  Globe2Icon,
  MailCheckIcon,
  MapPinIcon,
  MousePointerClickIcon,
  PanelRightOpenIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { deleteSubscriberAction } from "@/app/dashboard/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDuration, formatLocation } from "@/lib/analytics-display"
import { cn } from "@/lib/utils"
import type { CampaignQuestion, Subscriber, SubscriberAnalytics } from "@/types/database"

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
})
const sourceLabels: Record<string, string> = {
  direct: "直接访问",
  internal: "站内跳转",
}
const deviceLabels: Record<SubscriberAnalytics["deviceType"], string> = {
  desktop: "桌面端",
  mobile: "移动端",
  tablet: "平板",
  unknown: "未知设备",
}

function getSourceLabel(source: string | undefined) {
  return source ? (sourceLabels[source] ?? source) : "来源未知"
}

function SubscriberAnswers({
  subscriber,
  questions,
}: {
  subscriber: Subscriber
  questions: CampaignQuestion[]
}) {
  const questionById = new Map(questions.map((question) => [question.id, question.label]))
  const answers = Object.entries(subscriber.answers)

  if (answers.length === 0) {
    return <p className="text-sm text-muted-foreground">这次预约没有填写问卷。</p>
  }

  return (
    <dl className="subscriber-detail-answers">
      {answers.map(([questionId, answer], index) => (
        <div key={questionId}>
          <dt>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {questionById.get(questionId) ?? questionId}
          </dt>
          <dd>{Array.isArray(answer) ? answer.join(" / ") : answer}</dd>
        </div>
      ))}
    </dl>
  )
}

function DeleteSubscriberButton({
  campaignId,
  subscriber,
}: {
  campaignId: string
  subscriber: Subscriber
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`删除 ${subscriber.email}`}
            title="删除预约"
          />
        }
      >
        <Trash2Icon aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>删除这条预约？</AlertDialogTitle>
          <AlertDialogDescription>
            {subscriber.email} 将从当前项目的预约名单中永久移除。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form action={deleteSubscriberAction}>
            <input type="hidden" name="campaignId" value={campaignId} />
            <input type="hidden" name="subscriberId" value={subscriber.id} />
            <AlertDialogAction type="submit" variant="destructive">
              确认删除
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function SubscriberDetailSheet({
  campaignId,
  onCopyEmail,
  onOpenChange,
  questions,
  subscriber,
}: {
  campaignId: string
  onCopyEmail: (email: string) => void
  onOpenChange: (open: boolean) => void
  questions: CampaignQuestion[]
  subscriber: Subscriber | null
}) {
  const analytics = subscriber?.analytics

  return (
    <Sheet open={Boolean(subscriber)} onOpenChange={onOpenChange}>
      <SheetContent className="subscriber-detail-sheet w-full! border-0 sm:max-w-xl!">
        {subscriber ? (
          <>
            <SheetHeader className="subscriber-detail-header">
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="secondary">{getSourceLabel(analytics?.source)}</Badge>
                {analytics ? (
                  <Badge variant="outline">{deviceLabels[analytics.deviceType]}</Badge>
                ) : null}
              </div>
              <SheetTitle className="truncate text-lg">{subscriber.email}</SheetTitle>
              <SheetDescription>
                预约于 {dateFormatter.format(new Date(subscriber.created_at))}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="min-h-0 flex-1">
              <div className="subscriber-detail-content">
                <section aria-labelledby="subscriber-engagement-title">
                  <header>
                    <p>BEHAVIOR</p>
                    <h3 id="subscriber-engagement-title">参与度</h3>
                  </header>
                  {analytics ? (
                    <dl className="subscriber-detail-metrics">
                      <div>
                        <Clock3Icon aria-hidden="true" />
                        <dt>有效停留</dt>
                        <dd>{formatDuration(analytics.engagementSeconds)}</dd>
                      </div>
                      <div>
                        <EyeIcon aria-hidden="true" />
                        <dt>页面浏览</dt>
                        <dd>{analytics.pageViews} 次</dd>
                      </div>
                      <div>
                        <Globe2Icon aria-hidden="true" />
                        <dt>访问会话</dt>
                        <dd>{analytics.sessions} 次</dd>
                      </div>
                      <div>
                        <MousePointerClickIcon aria-hidden="true" />
                        <dt>页面交互</dt>
                        <dd>{analytics.interactionCount} 次</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="subscriber-detail-empty">
                      该预约产生于行为采集启用前，暂无可关联的访问记录。
                    </p>
                  )}
                </section>

                {analytics ? (
                  <>
                    <Separator />
                    <section aria-labelledby="subscriber-journey-title">
                      <header>
                        <p>JOURNEY</p>
                        <h3 id="subscriber-journey-title">访问路径</h3>
                      </header>
                      <dl className="subscriber-detail-list">
                        <DetailItem label="来源" value={getSourceLabel(analytics.source)} />
                        <DetailItem label="媒介" value={analytics.medium ?? "未标记"} />
                        <DetailItem label="活动标签" value={analytics.campaignTag ?? "未标记"} />
                        <DetailItem
                          label="最大滚动"
                          value={`${analytics.maxScrollDepth.toFixed(0)}%`}
                        />
                        <DetailItem
                          label="首次访问"
                          value={dateFormatter.format(new Date(analytics.firstSeenAt))}
                        />
                        <DetailItem
                          label="最近访问"
                          value={dateFormatter.format(new Date(analytics.lastSeenAt))}
                        />
                      </dl>
                    </section>

                    <Separator />
                    <section aria-labelledby="subscriber-context-title">
                      <header>
                        <p>CONTEXT</p>
                        <h3 id="subscriber-context-title">地域与环境</h3>
                      </header>
                      <dl className="subscriber-detail-list">
                        <DetailItem label="地区" value={formatLocation(analytics)} />
                        <DetailItem label="设备" value={deviceLabels[analytics.deviceType]} />
                        <DetailItem label="语言" value={analytics.locale ?? "未知"} />
                        <DetailItem label="时区" value={analytics.timezone ?? "未知"} />
                      </dl>
                    </section>
                  </>
                ) : null}

                <Separator />
                <section aria-labelledby="subscriber-answers-title">
                  <header>
                    <p>RESPONSE</p>
                    <h3 id="subscriber-answers-title">问卷回答</h3>
                  </header>
                  <SubscriberAnswers subscriber={subscriber} questions={questions} />
                </section>
              </div>
            </ScrollArea>

            <SheetFooter className="subscriber-detail-footer">
              <Button type="button" variant="outline" onClick={() => onCopyEmail(subscriber.email)}>
                <CopyIcon data-icon="inline-start" aria-hidden="true" />
                复制邮箱
              </Button>
              <DeleteSubscriberButton campaignId={campaignId} subscriber={subscriber} />
            </SheetFooter>
          </>
        ) : (
          <SheetHeader>
            <SheetTitle>预约详情</SheetTitle>
            <SheetDescription>选择一条预约记录查看完整信息。</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SubscriberSummary({ analytics }: { analytics: SubscriberAnalytics | null }) {
  if (!analytics) {
    return <span className="text-xs text-muted-foreground">暂无行为数据</span>
  }

  return (
    <span className="subscriber-engagement-summary">
      <strong>{formatDuration(analytics.engagementSeconds)}</strong>
      <small>
        {analytics.pageViews} PV · 滚动 {analytics.maxScrollDepth.toFixed(0)}%
      </small>
    </span>
  )
}

export function SubscriberManagement({
  campaignId,
  questions,
  subscribers,
}: {
  campaignId: string
  questions: CampaignQuestion[]
  subscribers: Subscriber[]
}) {
  const [query, setQuery] = useState("")
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null)
  const filteredSubscribers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return subscribers
    }

    return subscribers.filter((subscriber) => {
      const analytics = subscriber.analytics
      const searchable = [
        subscriber.email,
        analytics?.source,
        analytics?.medium,
        analytics?.campaignTag,
        analytics?.countryCode,
        analytics?.region,
        analytics?.city,
        analytics?.timezone,
        analytics?.locale,
      ]

      return searchable.some((value) => value?.toLowerCase().includes(normalizedQuery))
    })
  }, [query, subscribers])

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email)
      toast.success("邮箱已复制")
    } catch {
      toast.error("无法复制邮箱，请检查浏览器权限")
    }
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="subscriber-list-title">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <h2 id="subscriber-list-title" className="text-sm font-semibold">
            预约记录
          </h2>
          <Badge variant="secondary">{subscribers.length}</Badge>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="h-9 sm:w-72">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索邮箱、来源或地区"
              aria-label="搜索预约邮箱、来源或地区"
            />
          </InputGroup>
          <Link
            href={`/dashboard/campaigns/${campaignId}/subscribers/export`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-9")}
          >
            <DownloadIcon data-icon="inline-start" aria-hidden="true" />
            导出 CSV
          </Link>
        </div>
      </header>

      {subscribers.length === 0 ? (
        <Empty className="rounded-lg border bg-card py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailCheckIcon />
            </EmptyMedia>
            <EmptyTitle>还没有预约记录</EmptyTitle>
            <EmptyDescription>发布并分享页面后，新预约会出现在这里。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="grid gap-2 sm:hidden">
            {filteredSubscribers.map((subscriber) => (
              <Card
                key={subscriber.id}
                size="sm"
                className="subscriber-mobile-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSubscriber(subscriber)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSelectedSubscriber(subscriber)
                  }
                }}
              >
                <CardHeader>
                  <CardTitle className="truncate">{subscriber.email}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(subscriber.created_at))}
                  </p>
                </CardHeader>
                <CardContent>
                  <dl className="subscriber-mobile-summary">
                    <div>
                      <dt>来源</dt>
                      <dd>{getSourceLabel(subscriber.analytics?.source)}</dd>
                    </div>
                    <div>
                      <dt>地区</dt>
                      <dd>
                        {subscriber.analytics ? formatLocation(subscriber.analytics) : "未知地区"}
                      </dd>
                    </div>
                  </dl>
                  <SubscriberSummary analytics={subscriber.analytics} />
                </CardContent>
                <CardFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedSubscriber(subscriber)
                    }}
                  >
                    查看详情
                    <PanelRightOpenIcon data-icon="inline-end" aria-hidden="true" />
                  </Button>
                  <div
                    className="flex gap-1"
                    role="toolbar"
                    aria-label={`管理 ${subscriber.email}`}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`复制 ${subscriber.email}`}
                      title="复制邮箱"
                      onClick={() => void copyEmail(subscriber.email)}
                    >
                      <CopyIcon aria-hidden="true" />
                    </Button>
                    <DeleteSubscriberButton campaignId={campaignId} subscriber={subscriber} />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="subscriber-table-shell hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">邮箱</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>地区</TableHead>
                  <TableHead>参与度</TableHead>
                  <TableHead>预约时间</TableHead>
                  <TableHead className="w-32 text-right">
                    <span className="sr-only">操作</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow
                    key={subscriber.id}
                    className="subscriber-table-row"
                    tabIndex={0}
                    aria-label={`查看 ${subscriber.email} 的详情`}
                    onClick={() => setSelectedSubscriber(subscriber)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedSubscriber(subscriber)
                      }
                    }}
                  >
                    <TableCell className="max-w-64 pl-4 font-medium">
                      <span className="block truncate">{subscriber.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getSourceLabel(subscriber.analytics?.source)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 text-muted-foreground">
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPinIcon aria-hidden="true" />
                        {subscriber.analytics ? formatLocation(subscriber.analytics) : "未知地区"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <SubscriberSummary analytics={subscriber.analytics} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(subscriber.created_at))}
                    </TableCell>
                    <TableCell
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`查看 ${subscriber.email} 的详情`}
                          title="查看详情"
                          onClick={() => setSelectedSubscriber(subscriber)}
                        >
                          <PanelRightOpenIcon aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`复制 ${subscriber.email}`}
                          title="复制邮箱"
                          onClick={() => void copyEmail(subscriber.email)}
                        >
                          <CopyIcon aria-hidden="true" />
                        </Button>
                        <DeleteSubscriberButton campaignId={campaignId} subscriber={subscriber} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSubscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      没有匹配的邮箱、来源或地区
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {filteredSubscribers.length === 0 ? (
            <p className="rounded-lg bg-card px-4 py-10 text-center text-sm text-muted-foreground sm:hidden">
              没有匹配的邮箱、来源或地区
            </p>
          ) : null}
        </>
      )}

      <SubscriberDetailSheet
        campaignId={campaignId}
        onCopyEmail={(email) => void copyEmail(email)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSubscriber(null)
          }
        }}
        questions={questions}
        subscriber={selectedSubscriber}
      />
    </section>
  )
}

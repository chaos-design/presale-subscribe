"use client"

import {
  ActivityIcon,
  ArrowRightIcon,
  ChartNoAxesColumnIncreasingIcon,
  Clock3Icon,
  EyeIcon,
  MailCheckIcon,
  MapPinIcon,
  MousePointerClickIcon,
  Repeat2Icon,
  ScanLineIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatDuration, formatLocation } from "@/lib/analytics-display"
import { cn } from "@/lib/utils"
import {
  type AnalyticsRange,
  analyticsRangeValues,
  type ProjectAnalytics,
  type QuestionAnalytics,
  type TrafficAnalyticsItem,
} from "@/types/database"

const numberFormatter = new Intl.NumberFormat("zh-CN")
const shortDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
})
const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
})

const trendChartConfig = {
  pageViews: { label: "PV", color: "var(--chart-1)" },
  uniqueVisitors: { label: "UV", color: "var(--chart-2)" },
  applications: { label: "申请", color: "var(--chart-3)" },
} satisfies ChartConfig

const deviceChartConfig = {
  desktop: { label: "桌面端", color: "var(--chart-1)" },
  mobile: { label: "移动端", color: "var(--chart-2)" },
  tablet: { label: "平板", color: "var(--chart-3)" },
  unknown: { label: "未知", color: "var(--chart-4)" },
} satisfies ChartConfig

const emailDomainChartConfig = {
  applications: { label: "申请数", color: "var(--chart-1)" },
} satisfies ChartConfig

const questionChartConfig = {
  selections: { label: "回答数", color: "var(--chart-3)" },
} satisfies ChartConfig

const deviceColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]
const shareColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]
const sourceLabels: Record<string, string> = {
  direct: "直接访问",
  internal: "站内跳转",
}
const deviceLabels: Record<string, string> = {
  desktop: "桌面端",
  mobile: "移动端",
  tablet: "平板",
  unknown: "未知",
}
const questionTypeLabels = {
  multiple_choice: "多选",
  short_text: "简答",
  single_choice: "单选",
} as const

interface AnalyticsProject {
  id: string
  name: string
  slug: string
}

function formatDate(value: string) {
  return shortDateFormatter.format(new Date(`${value}T00:00:00.000Z`))
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`
}

function getRatio(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0
}

function AnalyticsRangeSelector({
  projectId,
  range,
}: {
  projectId: string
  range: AnalyticsRange
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <ToggleGroup
      value={[String(range)]}
      onValueChange={(values) => {
        const nextRange = Number(values[0]) as AnalyticsRange
        if (!analyticsRangeValues.includes(nextRange) || nextRange === range) {
          return
        }

        startTransition(() =>
          router.push(`/dashboard/analytics?project=${projectId}&days=${nextRange}`)
        )
      }}
      variant="outline"
      size="sm"
      spacing={1}
      className="analytics-range-selector"
      aria-label="选择分析时间范围"
      aria-busy={isPending}
    >
      {analyticsRangeValues.map((value) => (
        <ToggleGroupItem key={value} value={String(value)} aria-label={`最近 ${value} 天`}>
          {value} 天
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function AnalyticsProjectSelector({
  projects,
  range,
  selectedProject,
}: {
  projects: AnalyticsProject[]
  range: AnalyticsRange
  selectedProject: AnalyticsProject
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const options = projects.map((project) => ({ label: project.name, value: project.id }))

  return (
    <div className="analytics-project-selector">
      <span>当前项目</span>
      <Select
        items={options}
        value={selectedProject.id}
        onValueChange={(value) => {
          if (!value || value === selectedProject.id) {
            return
          }

          startTransition(() => router.push(`/dashboard/analytics?project=${value}&days=${range}`))
        }}
      >
        <SelectTrigger aria-label="选择分析项目" aria-busy={isPending}>
          <SelectValue>{selectedProject.name}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function MetricItem({
  icon: Icon,
  index,
  label,
  note,
  value,
}: {
  icon: typeof EyeIcon
  index: string
  label: string
  note: string
  value: string
}) {
  return (
    <div>
      <span>{index}</span>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <small>{note}</small>
      <Icon aria-hidden="true" />
    </div>
  )
}

function AnalyticsEmptyState({ description }: { description: string }) {
  return (
    <Empty className="analytics-empty-state">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ChartNoAxesColumnIncreasingIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>暂无数据</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function ShareDistributionChart({
  ariaLabel,
  className,
  items,
}: {
  ariaLabel: string
  className: string
  items: Array<{
    color: string
    label: string
    value: number
  }>
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  if (total <= 0) {
    return null
  }

  const chartData = items.reduce<Record<string, number | string>>(
    (data, item, index) => {
      data[`share${index}`] = getRatio(item.value, total)
      return data
    },
    { name: "PV 占比" }
  )
  const chartConfig = Object.fromEntries(
    items.map((item, index) => [
      `share${index}`,
      {
        color: item.color,
        label: item.label,
      },
    ])
  ) satisfies ChartConfig

  return (
    <div className={cn("analytics-share-chart", className)}>
      <div>
        <span>PV 占比</span>
        <small>{items.length} 个维度</small>
      </div>
      <ChartContainer
        aria-label={ariaLabel}
        className="h-12 w-full aspect-auto"
        config={chartConfig}
      >
        <BarChart
          accessibilityLayer
          data={[chartData]}
          layout="vertical"
          margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                indicator="line"
                formatter={(value, name) => {
                  const index = Number(String(name).replace("share", ""))
                  const item = items[index]
                  return (
                    <>
                      <span className="text-muted-foreground">{item?.label ?? name}</span>
                      <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
                        {formatPercent(Number(value))}
                      </span>
                    </>
                  )
                }}
              />
            }
          />
          {items.map((item, index) => (
            <Bar
              key={`${item.label}:${index}`}
              dataKey={`share${index}`}
              stackId="share"
              fill={item.color}
              maxBarSize={18}
              radius={
                items.length === 1
                  ? [4, 4, 4, 4]
                  : index === 0
                    ? [4, 0, 0, 4]
                    : index === items.length - 1
                      ? [0, 4, 4, 0]
                      : 0
              }
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  )
}

function TrendChart({ analytics }: { analytics: ProjectAnalytics }) {
  const latestPoint = analytics.daily[analytics.daily.length - 1]
  const peakTrafficPoint = analytics.daily.reduce<(typeof analytics.daily)[number] | null>(
    (current, point) => (!current || point.pageViews > current.pageViews ? point : current),
    null
  )
  const peakApplicationPoint = analytics.daily.reduce<(typeof analytics.daily)[number] | null>(
    (current, point) => (!current || point.applications > current.applications ? point : current),
    null
  )
  const averageDailyViews =
    analytics.daily.length > 0 ? analytics.totals.pageViews / analytics.daily.length : 0
  const averageDailyVisitors =
    analytics.daily.length > 0 ? analytics.totals.uniqueVisitors / analytics.daily.length : 0

  return (
    <Card className="analytics-panel" data-dashboard-reveal>
      <CardHeader>
        <CardTitle>访问与申请趋势</CardTitle>
        <CardDescription>
          每日 PV、UV 与新申请；UV 在每天内去重，区间 UV 会跨天再次去重。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={trendChartConfig} className="h-64 w-full aspect-auto">
          <ComposedChart accessibilityLayer data={analytics.daily} margin={{ left: 2, right: 2 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={28}
              tickFormatter={formatDate}
            />
            <YAxis yAxisId="traffic" hide />
            <YAxis yAxisId="applications" orientation="right" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(String(value))}
                  indicator="line"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              yAxisId="traffic"
              dataKey="pageViews"
              type="monotone"
              fill="var(--color-pageViews)"
              fillOpacity={0.16}
              stroke="var(--color-pageViews)"
              strokeWidth={2}
            />
            <Line
              yAxisId="traffic"
              dataKey="uniqueVisitors"
              type="monotone"
              stroke="var(--color-uniqueVisitors)"
              strokeWidth={2}
              dot={false}
            />
            <Bar
              yAxisId="applications"
              dataKey="applications"
              fill="var(--color-applications)"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
            />
          </ComposedChart>
        </ChartContainer>
        <dl className="analytics-trend-summary">
          <div>
            <dt>
              <i style={{ background: "var(--chart-1)" }} />
              最近一天
            </dt>
            <dd>
              <strong>{latestPoint ? formatDate(latestPoint.date) : "暂无"}</strong>
              <small>
                {latestPoint
                  ? `${numberFormatter.format(latestPoint.pageViews)} PV · ${numberFormatter.format(latestPoint.uniqueVisitors)} UV · ${numberFormatter.format(latestPoint.applications)} 份申请`
                  : "等待访问数据"}
              </small>
            </dd>
          </div>
          <div>
            <dt>
              <i style={{ background: "var(--chart-2)" }} />
              访问峰值
            </dt>
            <dd>
              <strong>{peakTrafficPoint ? formatDate(peakTrafficPoint.date) : "暂无"}</strong>
              <small>
                {peakTrafficPoint
                  ? `${numberFormatter.format(peakTrafficPoint.pageViews)} PV · ${numberFormatter.format(peakTrafficPoint.uniqueVisitors)} UV`
                  : "等待访问数据"}
              </small>
            </dd>
          </div>
          <div>
            <dt>
              <i style={{ background: "var(--chart-3)" }} />
              申请峰值
            </dt>
            <dd>
              <strong>
                {peakApplicationPoint ? formatDate(peakApplicationPoint.date) : "暂无"}
              </strong>
              <small>
                {peakApplicationPoint
                  ? `${numberFormatter.format(peakApplicationPoint.applications)} 份 · ${formatPercent(
                      getRatio(
                        peakApplicationPoint.applications,
                        peakApplicationPoint.uniqueVisitors
                      )
                    )} UV 转化`
                  : "等待申请数据"}
              </small>
            </dd>
          </div>
          <div>
            <dt>
              <i style={{ background: "var(--chart-4)" }} />
              日均访问
            </dt>
            <dd>
              <strong>{numberFormatter.format(Math.round(averageDailyViews))} PV</strong>
              <small>
                {numberFormatter.format(Math.round(averageDailyVisitors))} UV · 最近{" "}
                {analytics.rangeDays} 天
              </small>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

function TrafficList({ items, total }: { items: TrafficAnalyticsItem[]; total: number }) {
  return (
    <ol className="analytics-ranked-list">
      {items.map((item, index) => {
        const ratio = getRatio(item.pageViews, total)
        return (
          <li key={item.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div>
                <strong>{sourceLabels[item.label] ?? item.label}</strong>
                <small>{numberFormatter.format(item.uniqueVisitors)} UV</small>
              </div>
              <i>
                <b style={{ width: `${Math.max(ratio, ratio > 0 ? 2 : 0)}%` }} />
              </i>
            </div>
            <strong>
              {numberFormatter.format(item.pageViews)}
              <small>
                {item.uniqueVisitors > 0
                  ? `${(item.pageViews / item.uniqueVisitors).toFixed(2)} 次/访客 · ${formatDuration(item.averageDurationSeconds)} · 滚动 ${formatPercent(item.averageScrollDepth)}`
                  : "0 PV / UV"}
              </small>
            </strong>
          </li>
        )
      })}
    </ol>
  )
}

function TrafficBreakdowns({ analytics }: { analytics: ProjectAnalytics }) {
  const deviceData = analytics.devices.map((item, index) => ({
    ...item,
    displayLabel: deviceLabels[item.label] ?? item.label,
    fill: deviceColors[index % deviceColors.length],
  }))

  return (
    <section className="analytics-breakdown-grid" aria-label="流量构成" data-dashboard-reveal>
      <Card className="analytics-panel">
        <CardHeader>
          <CardTitle>访问来源</CardTitle>
          <CardDescription>优先识别 UTM Source，其次使用外部来源域名。</CardDescription>
        </CardHeader>
        <CardContent>
          <TrafficList items={analytics.sources} total={analytics.totals.pageViews} />
        </CardContent>
      </Card>

      <Card className="analytics-panel">
        <CardHeader>
          <CardTitle>设备构成</CardTitle>
          <CardDescription>按访问发生时的页面宽度分为桌面、平板和移动端。</CardDescription>
        </CardHeader>
        <CardContent className="analytics-device-content">
          <ChartContainer config={deviceChartConfig} className="h-44 w-full max-w-52 aspect-auto">
            <PieChart accessibilityLayer>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
              <Pie
                data={deviceData}
                dataKey="pageViews"
                nameKey="label"
                innerRadius={54}
                outerRadius={86}
                strokeWidth={0}
              >
                {deviceData.map((item) => (
                  <Cell key={item.label} fill={item.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <dl>
            {deviceData.map((item) => (
              <div key={item.label}>
                <dt>
                  <i style={{ background: item.fill }} />
                  {item.displayLabel}
                </dt>
                <dd>
                  <strong>
                    {formatPercent(getRatio(item.pageViews, analytics.totals.pageViews))}
                  </strong>
                  <small>
                    {numberFormatter.format(item.pageViews)} PV ·{" "}
                    {numberFormatter.format(item.uniqueVisitors)} UV ·{" "}
                    {formatDuration(item.averageDurationSeconds)} · 滚动{" "}
                    {formatPercent(item.averageScrollDepth)}
                  </small>
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </section>
  )
}

function DimensionSummary({ analytics }: { analytics: ProjectAnalytics }) {
  const leadingSource = analytics.sources[0]
  const leadingDevice = analytics.devices[0]
  const campaign = analytics.campaigns[0]
  const leadingDomain = analytics.emailDomains[0]

  return (
    <section className="analytics-dimension-summary" aria-labelledby="dimension-summary-title">
      <header>
        <div>
          <p>DIMENSION SNAPSHOT</p>
          <h2 id="dimension-summary-title">关键维度快照</h2>
        </div>
        <span>来源 · 设备 · 转化 · 行为 · 地域 · 人群</span>
      </header>
      <dl>
        <div>
          <dt>主力来源</dt>
          <dd>
            {leadingSource ? (sourceLabels[leadingSource.label] ?? leadingSource.label) : "暂无"}
          </dd>
          <small>
            {leadingSource
              ? `${formatPercent(
                  getRatio(leadingSource.uniqueVisitors, analytics.totals.uniqueVisitors)
                )} UV 占比`
              : "等待访问数据"}
          </small>
        </div>
        <div>
          <dt>核心设备</dt>
          <dd>
            {leadingDevice ? (deviceLabels[leadingDevice.label] ?? leadingDevice.label) : "暂无"}
          </dd>
          <small>
            {leadingDevice
              ? `${formatPercent(getRatio(leadingDevice.pageViews, analytics.totals.pageViews))} PV 占比`
              : "等待访问数据"}
          </small>
        </div>
        <div>
          <dt>当前转化</dt>
          <dd>{campaign ? formatPercent(campaign.conversionRate) : "暂无"}</dd>
          <small>
            {campaign
              ? `${numberFormatter.format(campaign.applications)} 份区间申请`
              : "等待访问数据"}
          </small>
        </div>
        <div>
          <dt>主力邮箱</dt>
          <dd>{leadingDomain?.label ?? "暂无"}</dd>
          <small>
            {leadingDomain
              ? `${formatPercent(
                  getRatio(leadingDomain.applications, analytics.totals.applications)
                )} 申请占比`
              : "等待申请数据"}
          </small>
        </div>
      </dl>
    </section>
  )
}

function ConversionAnalysis({ analytics }: { analytics: ProjectAnalytics }) {
  const campaign = analytics.campaigns[0]
  if (!campaign) {
    return null
  }

  const totals = analytics.totals
  const viewsPerSession = totals.sessions > 0 ? totals.pageViews / totals.sessions : 0
  const sessionsPerVisitor = totals.uniqueVisitors > 0 ? totals.sessions / totals.uniqueVisitors : 0
  const sessionConversion = getRatio(totals.applications, totals.sessions)
  const viewConversion = getRatio(totals.applications, totals.pageViews)
  const unconvertedVisitors = Math.max(0, totals.uniqueVisitors - totals.applications)

  return (
    <section className="analytics-conversion-detail" aria-labelledby="conversion-detail-title">
      <header className="dashboard-section-heading">
        <div>
          <h2 id="conversion-detail-title">项目转化明细</h2>
          <p>从独立访客到预约申请，并拆解会话频次与页面效率。</p>
        </div>
        <Link
          href={`/dashboard/campaigns/${campaign.id}/subscribers`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          查看申请明细
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </header>

      <ol className="analytics-conversion-path" data-dashboard-reveal>
        <li>
          <span>01</span>
          <small>独立访客</small>
          <strong>{numberFormatter.format(totals.uniqueVisitors)}</strong>
          <p>区间内去重访问人数</p>
        </li>
        <li>
          <span>02</span>
          <small>访问会话</small>
          <strong>{numberFormatter.format(totals.sessions)}</strong>
          <p>{sessionsPerVisitor.toFixed(2)} 次会话 / 访客</p>
        </li>
        <li>
          <span>03</span>
          <small>预约申请</small>
          <strong>{numberFormatter.format(totals.applications)}</strong>
          <p>{formatPercent(totals.conversionRate)} UV 转化</p>
        </li>
      </ol>

      <dl className="analytics-conversion-stats" data-dashboard-reveal>
        <div>
          <dt>每次会话浏览</dt>
          <dd>{viewsPerSession.toFixed(2)}</dd>
          <small>PV / 会话</small>
        </div>
        <div>
          <dt>会话申请率</dt>
          <dd>{formatPercent(sessionConversion)}</dd>
          <small>申请 / 会话</small>
        </div>
        <div>
          <dt>页面申请率</dt>
          <dd>{formatPercent(viewConversion)}</dd>
          <small>申请 / PV</small>
        </div>
        <div>
          <dt>未转化访客</dt>
          <dd>{numberFormatter.format(unconvertedVisitors)}</dd>
          <small>UV - 申请</small>
        </div>
        <div>
          <dt>区间申请</dt>
          <dd>{numberFormatter.format(totals.applications)}</dd>
          <small>最近 {analytics.rangeDays} 天</small>
        </div>
        <div>
          <dt>累计申请</dt>
          <dd>{numberFormatter.format(totals.allTimeApplications)}</dd>
          <small>项目发布以来</small>
        </div>
      </dl>
    </section>
  )
}

function BehaviorAndLocation({ analytics }: { analytics: ProjectAnalytics }) {
  const totals = analytics.totals
  const locationShareItems = analytics.locations.map((location, index) => ({
    color: shareColors[index % shareColors.length],
    label: formatLocation(location),
    value: location.pageViews,
  }))
  const deviceShareItems = analytics.devices.map((device, index) => ({
    color: deviceColors[index % deviceColors.length],
    label: deviceLabels[device.label] ?? device.label,
    value: device.pageViews,
  }))

  return (
    <div className="flex flex-col gap-4">
      <dl className="analytics-behavior-metrics" data-dashboard-reveal>
        <div>
          <Clock3Icon aria-hidden="true" />
          <dt>平均有效停留</dt>
          <dd>{formatDuration(totals.averageDurationSeconds)}</dd>
          <small>按每次页面浏览计算</small>
        </div>
        <div>
          <ScanLineIcon aria-hidden="true" />
          <dt>平均滚动深度</dt>
          <dd>{formatPercent(totals.averageScrollDepth)}</dd>
          <small>页面最大到达位置</small>
        </div>
        <div>
          <ActivityIcon aria-hidden="true" />
          <dt>参与浏览率</dt>
          <dd>{formatPercent(totals.engagedViewRate)}</dd>
          <small>停留、滚动或交互达标</small>
        </div>
        <div>
          <MousePointerClickIcon aria-hidden="true" />
          <dt>平均交互</dt>
          <dd>{totals.averageInteractions.toFixed(1)}</dd>
          <small>点击与输入次数 / PV</small>
        </div>
      </dl>

      <section className="analytics-behavior-grid" aria-label="行为与地域">
        <Card className="analytics-panel">
          <CardHeader>
            <CardTitle>地域分布</CardTitle>
            <CardDescription>
              按访客打开公开页面时的请求 IP 所在地区汇总；仅保留国家、地区与城市，不保存 IP。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.locations.length > 0 ? (
              <>
                <ol className="analytics-location-list">
                  {analytics.locations.map((location, index) => (
                    <li key={`${location.countryCode}:${location.region}:${location.city}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <MapPinIcon
                        aria-hidden="true"
                        style={{ color: shareColors[index % shareColors.length] }}
                      />
                      <div>
                        <strong>{formatLocation(location)}</strong>
                        <small>
                          {numberFormatter.format(location.uniqueVisitors)} UV ·{" "}
                          {numberFormatter.format(location.pageViews)} PV ·{" "}
                          {formatPercent(getRatio(location.pageViews, totals.pageViews))} 流量
                        </small>
                      </div>
                      <b>{formatDuration(location.averageDurationSeconds)}</b>
                    </li>
                  ))}
                </ol>
                <ShareDistributionChart
                  ariaLabel="地域页面浏览占比"
                  className="analytics-location-share-chart"
                  items={locationShareItems}
                />
              </>
            ) : (
              <AnalyticsEmptyState description="当前区间没有可用的地域信息。" />
            )}
          </CardContent>
        </Card>

        <Card className="analytics-panel">
          <CardHeader>
            <CardTitle>设备参与质量</CardTitle>
            <CardDescription>比较不同设备的访问量、停留时间和内容到达深度。</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="analytics-quality-list">
              {analytics.devices.map((device, index) => (
                <div key={device.label}>
                  <dt>
                    <i style={{ background: deviceColors[index % deviceColors.length] }} />
                    {deviceLabels[device.label] ?? device.label}
                  </dt>
                  <dd>
                    <strong>{formatDuration(device.averageDurationSeconds)}</strong>
                    <span>{formatPercent(device.averageScrollDepth)} 滚动</span>
                    <small>{numberFormatter.format(device.pageViews)} PV</small>
                  </dd>
                </div>
              ))}
            </dl>
            <ShareDistributionChart
              ariaLabel="设备页面浏览占比"
              className="analytics-device-share-chart"
              items={deviceShareItems}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function EmailDomainAnalysis({ analytics }: { analytics: ProjectAnalytics }) {
  const chartData = analytics.emailDomains.map((item) => ({
    ...item,
    summary: `${numberFormatter.format(item.applications)} · ${formatPercent(
      getRatio(item.applications, analytics.totals.applications)
    )}`,
  }))
  const chartHeight = Math.max(156, chartData.length * 38)

  return (
    <Card className="analytics-panel" data-dashboard-reveal>
      <CardHeader>
        <CardTitle>申请邮箱域名</CardTitle>
        <CardDescription>观察主要触达人群使用的邮箱服务商，不展示完整邮箱。</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer
            config={emailDomainChartConfig}
            className="analytics-domain-chart w-full aspect-auto"
            style={{ height: chartHeight }}
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 4, right: 78 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis dataKey="applications" type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={88}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel indicator="line" />}
              />
              <Bar
                dataKey="applications"
                fill="var(--color-applications)"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              >
                <LabelList
                  dataKey="summary"
                  position="right"
                  className="fill-foreground font-mono"
                  fontSize={10}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <AnalyticsEmptyState description="当前区间还没有申请邮箱域名数据。" />
        )}
      </CardContent>
    </Card>
  )
}

function QuestionInsightCard({ insight }: { insight: QuestionAnalytics }) {
  const completionRate = getRatio(insight.responses, insight.totalApplications)
  const chartData =
    insight.options.length > 0
      ? insight.options.map((option) => ({
          label: option.label,
          selections: option.selections,
          fill: "var(--chart-3)",
          summary: `${numberFormatter.format(option.selections)} · ${formatPercent(
            getRatio(option.selections, insight.responses)
          )}`,
        }))
      : [
          {
            label: "已填写",
            selections: insight.responses,
            fill: "var(--chart-3)",
            summary: `${numberFormatter.format(insight.responses)} · ${formatPercent(
              completionRate
            )}`,
          },
          {
            label: "未填写",
            selections: Math.max(0, insight.totalApplications - insight.responses),
            fill: "var(--chart-4)",
            summary: `${numberFormatter.format(
              Math.max(0, insight.totalApplications - insight.responses)
            )} · ${formatPercent(100 - completionRate)}`,
          },
        ]
  const chartHeight = Math.max(112, chartData.length * 38)

  return (
    <Card className="analytics-question-card">
      <CardHeader>
        <CardTitle>{insight.label}</CardTitle>
        <CardDescription>
          {insight.campaignName} · {numberFormatter.format(insight.responses)} /{" "}
          {numberFormatter.format(insight.totalApplications)} 份申请已回答
        </CardDescription>
        <CardAction className="flex gap-1.5">
          <Badge variant="outline">{questionTypeLabels[insight.type]}</Badge>
          {insight.required ? <Badge variant="secondary">必填</Badge> : null}
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="analytics-completion-row">
          <span>完成率</span>
          <strong>{formatPercent(completionRate)}</strong>
        </div>
        <ChartContainer
          config={questionChartConfig}
          className="analytics-question-chart w-full aspect-auto"
          style={{ height: chartHeight }}
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 4, right: 82 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis dataKey="selections" type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={104}
              tickFormatter={(value) => {
                const label = String(value)
                return label.length > 9 ? `${label.slice(0, 8)}...` : label
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel indicator="line" />}
            />
            <Bar dataKey="selections" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {chartData.map((item) => (
                <Cell key={item.label} fill={item.fill} />
              ))}
              <LabelList
                dataKey="summary"
                position="right"
                className="fill-foreground font-mono"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ChartContainer>

        {insight.options.length === 0 ? (
          <p className="analytics-text-response-note">
            已收集 {numberFormatter.format(insight.responses)} 条简答，可在申请明细中逐条查看原文。
          </p>
        ) : null}

        <Link
          href={`/dashboard/campaigns/${insight.campaignId}/subscribers`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-5 -ml-2")}
        >
          查看申请明细
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  )
}

function ApplicationInsights({ analytics }: { analytics: ProjectAnalytics }) {
  return (
    <div className="flex flex-col gap-6">
      <EmailDomainAnalysis analytics={analytics} />
      <section aria-labelledby="question-insights-title" data-dashboard-reveal>
        <header className="dashboard-section-heading">
          <div>
            <h2 id="question-insights-title">问卷回答分布</h2>
            <p>单选统计选项占比，多选统计选择率，简答统计有效填写率。</p>
          </div>
        </header>
        {analytics.questionInsights.length > 0 ? (
          <div className="analytics-question-grid">
            {analytics.questionInsights.map((insight) => (
              <QuestionInsightCard
                key={`${insight.campaignId}:${insight.questionId}`}
                insight={insight}
              />
            ))}
          </div>
        ) : (
          <Card className="analytics-panel">
            <CardHeader>
              <CardTitle>区间内还没有问卷回答</CardTitle>
              <CardDescription>
                发布包含问卷的页面并收到申请后，这里会展示填写率和选项分布。
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  )
}

export function AnalyticsDashboard({
  analytics,
  projects,
  range,
  selectedProject,
}: {
  analytics: ProjectAnalytics
  projects: AnalyticsProject[]
  range: AnalyticsRange
  selectedProject: AnalyticsProject
}) {
  const totals = analytics.totals
  const periodStartLabel = dateFormatter.format(new Date(`${analytics.periodStart}T00:00:00.000Z`))

  return (
    <>
      <header className="dashboard-page-heading">
        <div>
          <p data-eyebrow>PROJECT / RESPONSE INTELLIGENCE</p>
          <h1>项目数据，逐层拆解。</h1>
          <p>
            {selectedProject.name} · 从 {periodStartLabel}{" "}
            开始，按趋势、来源、设备、行为、地域、转化和申请回答拆解。
          </p>
        </div>
        <div className="analytics-page-controls">
          <AnalyticsProjectSelector
            projects={projects}
            range={range}
            selectedProject={selectedProject}
          />
          <AnalyticsRangeSelector projectId={selectedProject.id} range={range} />
        </div>
      </header>

      <dl className="dashboard-metrics analytics-metrics">
        <MetricItem
          index="01"
          label="页面浏览 PV"
          value={numberFormatter.format(totals.pageViews)}
          note={`累计 ${numberFormatter.format(totals.allTimePageViews)}`}
          icon={EyeIcon}
        />
        <MetricItem
          index="02"
          label="独立访客 UV"
          value={numberFormatter.format(totals.uniqueVisitors)}
          note={`累计 ${numberFormatter.format(totals.allTimeUniqueVisitors)}`}
          icon={UsersIcon}
        />
        <MetricItem
          index="03"
          label="新申请"
          value={numberFormatter.format(totals.applications)}
          note={`累计 ${numberFormatter.format(totals.allTimeApplications)}`}
          icon={MailCheckIcon}
        />
        <MetricItem
          index="04"
          label="UV 转化率"
          value={formatPercent(totals.conversionRate)}
          note="新申请 / 独立访客"
          icon={MousePointerClickIcon}
        />
        <MetricItem
          index="05"
          label="回访访客率"
          value={formatPercent(totals.returningVisitorRate)}
          note={`区间会话 ${numberFormatter.format(totals.sessions)}`}
          icon={Repeat2Icon}
        />
        <MetricItem
          index="06"
          label="人均浏览"
          value={totals.pageViewsPerVisitor.toFixed(2)}
          note="PV / UV"
          icon={ChartNoAxesColumnIncreasingIcon}
        />
      </dl>

      <Tabs defaultValue="overview" className="analytics-tabs">
        <TabsList variant="line" aria-label="分析视图">
          <TabsTrigger value="overview">趋势总览</TabsTrigger>
          <TabsTrigger value="acquisition">来源与设备</TabsTrigger>
          <TabsTrigger value="behavior">行为与地域</TabsTrigger>
          <TabsTrigger value="conversion">转化明细</TabsTrigger>
          <TabsTrigger value="applications">受众与需求</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="flex flex-col gap-6 pt-3">
          <DimensionSummary analytics={analytics} />
          <TrendChart analytics={analytics} />
        </TabsContent>
        <TabsContent value="acquisition" className="pt-3">
          <TrafficBreakdowns analytics={analytics} />
        </TabsContent>
        <TabsContent value="behavior" className="pt-3">
          <BehaviorAndLocation analytics={analytics} />
        </TabsContent>
        <TabsContent value="conversion" className="pt-3">
          <ConversionAnalysis analytics={analytics} />
        </TabsContent>
        <TabsContent value="applications" className="pt-3">
          <ApplicationInsights analytics={analytics} />
        </TabsContent>
      </Tabs>
    </>
  )
}

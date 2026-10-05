"use client"

import { gsap } from "gsap"
import {
  ActivityIcon,
  AppWindowMacIcon,
  ArrowLeftIcon,
  BatteryFullIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  Clock3Icon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  FilmIcon,
  LayersIcon,
  LayoutTemplateIcon,
  Maximize2Icon,
  MonitorIcon,
  MousePointer2Icon,
  Move3dIcon,
  PaletteIcon,
  RadarIcon,
  SaveIcon,
  SendIcon,
  SignalIcon,
  SmartphoneIcon,
  TagIcon,
  WavesIcon,
  WifiIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type MouseEvent,
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import { updateCampaignAction } from "@/app/dashboard/actions"
import { CampaignCoverImageEditor } from "@/components/campaign-cover-image-editor"
import { CampaignEditorSection } from "@/components/campaign-editor-section"
import {
  CampaignClosingEditor,
  CampaignHighlightsEditor,
  CampaignTimelineEditor,
} from "@/components/campaign-page-content-editor"
import { CampaignPreview } from "@/components/campaign-preview"
import { CampaignPreviewVideoEditor } from "@/components/campaign-preview-video-editor"
import { CampaignSectionOrganizer } from "@/components/campaign-section-organizer"
import { CampaignTemplatePicker } from "@/components/campaign-template-picker"
import { FieldLabelWithCount } from "@/components/field-label-with-count"
import { QuestionnaireBuilder } from "@/components/questionnaire-builder"
import { SubmitButton } from "@/components/submit-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { TimePicker } from "@/components/ui/time-picker"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  createCampaignConfig,
  defaultCampaignImagePosition,
  getMotionOptionsForTemplate,
  isMotionAvailableForTemplate,
  templateOptions,
  themeOptions,
} from "@/lib/campaign-presets"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { initialActionState } from "@/lib/validation"
import type {
  Campaign,
  CampaignConfig,
  CampaignCountdownConfig,
  CampaignMotion,
  CampaignMotionIntensity,
  CampaignTemplate,
} from "@/types/database"

type PreviewViewport = "desktop" | "mobile"
type PreviewMode = "edit" | "preview"
type EditorPanel =
  | "countdown"
  | "header"
  | "hero"
  | "highlights"
  | "sections"
  | "signup"
  | "slogan"
  | "template"
  | "timeline"
  | "video"

const editorSections = [
  { id: "campaign-identity", label: "标识", icon: TagIcon },
  { id: "campaign-layout", label: "模板", icon: LayoutTemplateIcon },
  { id: "campaign-header", label: "页头", icon: AppWindowMacIcon },
  { id: "campaign-content", label: "首屏", icon: FileTextIcon },
  { id: "campaign-countdown", label: "倒计时", icon: Clock3Icon },
  { id: "campaign-video", label: "视频", icon: FilmIcon },
  { id: "campaign-highlights", label: "亮点", icon: LayoutTemplateIcon },
  { id: "campaign-slogan", label: "标语", icon: WavesIcon },
  { id: "campaign-timeline", label: "节奏", icon: ActivityIcon },
  { id: "campaign-signup", label: "预约", icon: ClipboardListIcon },
  { id: "campaign-surface", label: "视觉", icon: PaletteIcon },
] as const
const editorSectionIds = new Set(editorSections.map((section) => section.id))

const previewTargetOptions = [
  { value: "title", label: "首屏内容", icon: FileTextIcon },
  { value: "countdown", label: "倒计时", icon: Clock3Icon },
  { value: "preview-video", label: "演示视频", icon: FilmIcon },
  { value: "feature-title", label: "核心亮点", icon: LayoutTemplateIcon },
  { value: "timeline-title", label: "发布节奏", icon: ActivityIcon },
  { value: "questionnaire-title", label: "预约问卷", icon: ClipboardListIcon },
] as const

const motionIconByValue = {
  cascade: LayersIcon,
  drift: WavesIcon,
  parallax: Move3dIcon,
  scan: RadarIcon,
  pulse: ActivityIcon,
  kinetic: ZapIcon,
} satisfies Record<CampaignMotion, typeof ActivityIcon>

const imageExtensionByType = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

const videoExtensionByType = {
  "video/mp4": "mp4",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/webm": "webm",
} as const

const motionIntensityOptions: Array<{
  value: CampaignMotionIntensity
  label: string
  description: string
}> = [
  { value: "subtle", label: "克制", description: "缩短位移，保持安静" },
  { value: "balanced", label: "均衡", description: "适合大多数发布页" },
  { value: "bold", label: "强烈", description: "放大位移与空间层次" },
]

const maxCoverImageSize = 8 * 1024 * 1024
const maxPreviewVideoSize = 100 * 1024 * 1024
const defaultCollapsedPanels: Record<EditorPanel, boolean> = {
  countdown: false,
  template: false,
  sections: false,
  header: false,
  hero: false,
  highlights: false,
  slogan: false,
  timeline: false,
  signup: false,
  video: false,
}

function getEditorPanelForTarget(target: string): EditorPanel | null {
  if (target === "header-brand" || target === "header-meta") {
    return "header"
  }

  if (target === "header-slogan" || target === "marquee-content") {
    return "slogan"
  }

  if (
    target === "eyebrow" ||
    target === "title" ||
    target === "description" ||
    target === "cover-image"
  ) {
    return "hero"
  }

  if (target === "countdown") {
    return "countdown"
  }

  if (target === "preview-video") {
    return "video"
  }

  if (
    target === "feature-title" ||
    target === "feature-description" ||
    target === "section-eyebrow" ||
    target.startsWith("highlight-")
  ) {
    return "highlights"
  }

  if (
    target === "timeline-title" ||
    target === "timeline-description" ||
    target.startsWith("milestone-")
  ) {
    return "timeline"
  }

  if (
    target === "closing-title" ||
    target === "closing-description" ||
    target === "email-label" ||
    target === "button-label" ||
    target === "questionnaire-title" ||
    target === "questionnaire-description" ||
    target.startsWith("question-")
  ) {
    return "signup"
  }

  return null
}

const previewToggleItemClassName =
  "border-white/15 bg-white/[0.04] text-white/55 hover:bg-white/10 hover:text-white data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground"

function PreviewViewportControl({
  value,
  onChange,
  fullscreen = false,
}: {
  value: PreviewViewport
  onChange: (viewport: PreviewViewport) => void
  fullscreen?: boolean
}) {
  const prefix = fullscreen ? "全屏" : ""

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const viewport = values[0] as PreviewViewport | undefined
        if (viewport) {
          onChange(viewport)
        }
      }}
      variant="outline"
      spacing={1}
      className="rounded-lg border border-white/10 bg-black/20 p-1"
      aria-label={`${prefix}预览尺寸`}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ToggleGroupItem
              value="desktop"
              className={previewToggleItemClassName}
              aria-label={`${prefix}桌面预览`}
            >
              <MonitorIcon aria-hidden="true" />
            </ToggleGroupItem>
          }
        />
        <TooltipContent>{prefix}桌面预览</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <ToggleGroupItem
              value="mobile"
              className={previewToggleItemClassName}
              aria-label={`${prefix}手机预览`}
            >
              <SmartphoneIcon aria-hidden="true" />
            </ToggleGroupItem>
          }
        />
        <TooltipContent>{prefix}手机预览</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  )
}

function PreviewModeControl({
  value,
  onChange,
}: {
  value: PreviewMode
  onChange: (mode: PreviewMode) => void
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const mode = values[0] as PreviewMode | undefined
        if (mode) {
          onChange(mode)
        }
      }}
      variant="outline"
      spacing={1}
      className="rounded-lg border border-white/10 bg-black/20 p-1"
      aria-label="画布模式"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <ToggleGroupItem
              value="edit"
              className={previewToggleItemClassName}
              aria-label="编辑模式"
            >
              <MousePointer2Icon aria-hidden="true" />
            </ToggleGroupItem>
          }
        />
        <TooltipContent>编辑模式</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <ToggleGroupItem
              value="preview"
              className={previewToggleItemClassName}
              aria-label="预览模式"
            >
              <EyeIcon aria-hidden="true" />
            </ToggleGroupItem>
          }
        />
        <TooltipContent>预览模式</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  )
}

function PreviewTargetControl({
  value,
  onChange,
}: {
  value: string
  onChange: (target: string) => void
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        if (values[0]) {
          onChange(values[0])
        }
      }}
      variant="outline"
      spacing={1}
      className="rounded-lg border border-white/10 bg-black/20 p-1"
      aria-label="编辑内容定位"
    >
      {previewTargetOptions.map((option) => {
        const Icon = option.icon

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger
              render={
                <ToggleGroupItem
                  value={option.value}
                  className={previewToggleItemClassName}
                  aria-label={option.label}
                >
                  <Icon aria-hidden="true" />
                </ToggleGroupItem>
              }
            />
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        )
      })}
    </ToggleGroup>
  )
}

function getUploadErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback
  }

  if (/row-level security policy/i.test(error.message)) {
    return "媒体上传被 Storage 权限策略拒绝，请在 Supabase SQL Editor 中执行项目最新的 supabase/update.sql 后重试。"
  }

  return error.message
}

function getDefaultCountdownTarget() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

function updateCountdownEnabled(
  countdown: CampaignCountdownConfig,
  enabled: boolean
): CampaignCountdownConfig {
  return {
    ...countdown,
    enabled,
    targetAt: enabled && !countdown.targetAt ? getDefaultCountdownTarget() : countdown.targetAt,
  }
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: keyof HTMLMediaElementEventMap) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error("视频读取超时，请换一个浏览器可播放的视频文件"))
    }, 12_000)

    function cleanup() {
      window.clearTimeout(timeoutId)
      video.removeEventListener(eventName, handleEvent)
      video.removeEventListener("error", handleError)
    }

    function handleEvent() {
      cleanup()
      resolve()
    }

    function handleError() {
      cleanup()
      reject(new Error("无法读取视频文件"))
    }

    video.addEventListener(eventName, handleEvent, { once: true })
    video.addEventListener("error", handleError, { once: true })
  })
}

async function createPreviewVideoPoster(file: File) {
  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement("video")

  try {
    video.muted = true
    video.playsInline = true
    video.preload = "auto"

    const metadataReady = waitForVideoEvent(video, "loadedmetadata")
    video.src = objectUrl
    video.load()
    await metadataReady

    const duration = Number.isFinite(video.duration) ? video.duration : 0
    const targetTime = duration > 1 ? 1 : Math.max(0, duration * 0.5)

    if (targetTime > 0) {
      const seeked = waitForVideoEvent(video, "seeked")
      video.currentTime = targetTime
      await seeked
    } else if (video.readyState < 2) {
      await waitForVideoEvent(video, "loadeddata")
    }

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("无法生成视频封面")
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")
    if (!context) {
      throw new Error("当前浏览器不支持视频截帧")
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
            return
          }

          reject(new Error("无法生成视频封面"))
        },
        "image/jpeg",
        0.86
      )
    })
  } finally {
    video.removeAttribute("src")
    video.load()
    URL.revokeObjectURL(objectUrl)
  }
}

function PreviewDeviceFrame({
  config,
  viewport,
  slug,
  activeEditorTarget,
  interactive = false,
}: {
  config: CampaignConfig
  viewport: PreviewViewport
  slug: string
  activeEditorTarget?: string
  interactive?: boolean
}) {
  if (viewport === "mobile") {
    return (
      <div className="preview-device preview-device-mobile" data-preview-device="mobile">
        <div className="preview-device-side-controls" aria-hidden="true">
          <i data-side="action" />
          <i data-side="volume-up" />
          <i data-side="volume-down" />
          <i data-side="power" />
        </div>
        <div className="preview-device-mobile-screen">
          <div className="preview-device-mobile-statusbar" aria-hidden="true">
            <span>9:41</span>
            <span className="preview-device-dynamic-island">
              <i />
              <b />
            </span>
            <span className="preview-device-mobile-signals">
              <SignalIcon />
              <WifiIcon />
              <BatteryFullIcon />
            </span>
          </div>
          <div className="preview-device-scroll">
            <CampaignPreview
              config={config}
              viewport="mobile"
              showQuestionnaire
              activeEditorTarget={activeEditorTarget}
              interactive={interactive}
            />
          </div>
          <div className="preview-device-home-area" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="preview-device preview-device-desktop w-full overflow-hidden rounded-md border border-white/15 bg-[#070909] shadow-2xl shadow-black/45"
      data-preview-device="desktop"
    >
      <div className="flex h-10 items-center gap-3 border-b border-white/10 bg-[#0d1111] px-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </div>
        <AppWindowMacIcon className="size-3.5 shrink-0 text-white/35" aria-hidden="true" />
        <div className="min-w-0 flex-1 truncate rounded-sm border border-white/10 bg-black/20 px-2 py-1 font-mono text-[9px] text-white/40">
          ahead.local/p/{slug}
        </div>
        <span className="font-mono text-[8px] text-white/30">1440</span>
      </div>
      <div className="preview-device-scroll max-h-[calc(100svh-16rem)] min-h-[420px] overflow-y-auto bg-black">
        <CampaignPreview
          config={config}
          viewport="desktop"
          showQuestionnaire
          activeEditorTarget={activeEditorTarget}
          interactive={interactive}
        />
      </div>
      <div className="flex h-7 items-center justify-between border-t border-white/10 bg-[#0d1111] px-3 font-mono text-[8px] uppercase text-white/30">
        <span>Render / Stable</span>
        <span style={{ color: config.themeColor }}>● Live</span>
      </div>
    </div>
  )
}

export function CampaignEditor({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [config, setConfig] = useState<CampaignConfig>(campaign.draft_config)
  const [name, setName] = useState(campaign.name)
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop")
  const [previewMode, setPreviewMode] = useState<PreviewMode>("edit")
  const [activePreviewTarget, setActivePreviewTarget] = useState("title")
  const [activeEditorSection, setActiveEditorSection] =
    useState<(typeof editorSections)[number]["id"]>("campaign-identity")
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false)
  const [collapsedPanels, setCollapsedPanels] =
    useState<Record<EditorPanel, boolean>>(defaultCollapsedPanels)
  const [hasLoadedCollapsedPanels, setHasLoadedCollapsedPanels] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [state, formAction] = useActionState(updateCampaignAction, initialActionState)
  const [pendingIntent, setPendingIntent] = useState<string | null>(null)
  const lastResult = useRef(state)
  const coverImageInputRef = useRef<HTMLInputElement>(null)
  const previewVideoInputRef = useRef<HTMLInputElement>(null)
  const localCoverImageUrl = useRef<string | null>(null)
  const localPreviewVideoUrl = useRef<string | null>(null)
  const localPreviewVideoPosterUrl = useRef<string | null>(null)
  const editorScrollRef = useRef<HTMLElement>(null)
  const editorRevealTimer = useRef<number | null>(null)
  const editorHighlightTimer = useRef<number | null>(null)
  const previewFrameRef = useRef<HTMLDivElement>(null)
  const previewCanvasRef = useRef<HTMLDivElement>(null)
  const previousViewport = useRef<PreviewViewport>(previewViewport)
  const previewMounted = useRef(false)
  const selectedTemplate = templateOptions.find((template) => template.value === config.template)
  const availableMotionOptions = getMotionOptionsForTemplate(config.template)
  const previewAnimationKey = `${config.template}:${config.motion}`
  const templatePickerId = "campaign-template-picker"
  const sectionOrganizerId = "campaign-section-organizer"
  const collapsedPanelsStorageKey = `ahead:campaign-editor:collapsed:${campaign.id}`
  const activeBodySectionCount =
    config.sectionOrder.filter(
      (section) =>
        config.sectionVisibility[section] &&
        (section !== "video" || Boolean(config.previewVideo.url))
    ).length + Number(config.countdown.enabled)

  // 记录本次提交来自哪个按钮，保证只有它进入加载态。
  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter

    setPendingIntent(submitter instanceof HTMLButtonElement ? submitter.value : null)
  }

  useEffect(() => {
    if (!state.message || state === lastResult.current) {
      return
    }

    lastResult.current = state

    if (state.status === "success") {
      // 首次发布没有可对比的历史版本，只在已有线上快照时展示版本号。
      toast.success(state.message, {
        description:
          state.version && campaign.published_config ? `版本 ${state.version}` : undefined,
      })
      router.refresh()
    } else if (state.status === "error") {
      toast.error(state.message)
    }
  }, [campaign.published_config, router, state])

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(collapsedPanelsStorageKey)
      if (storedValue) {
        const stored = JSON.parse(storedValue) as {
          version?: number
          panels?: Partial<Record<EditorPanel, boolean>>
        }
        if (stored.version === 1 && stored.panels) {
          setCollapsedPanels({
            countdown: stored.panels.countdown === true,
            template: stored.panels.template === true,
            sections: stored.panels.sections === true,
            header: stored.panels.header === true,
            hero: stored.panels.hero === true,
            highlights: stored.panels.highlights === true,
            slogan: stored.panels.slogan === true,
            timeline: stored.panels.timeline === true,
            signup: stored.panels.signup === true,
            video: stored.panels.video === true,
          })
        }
      }
    } catch {
      // Ignore unavailable or malformed browser storage.
    } finally {
      setHasLoadedCollapsedPanels(true)
    }
  }, [collapsedPanelsStorageKey])

  useEffect(() => {
    if (!hasLoadedCollapsedPanels) {
      return
    }

    try {
      window.localStorage.setItem(
        collapsedPanelsStorageKey,
        JSON.stringify({ version: 1, panels: collapsedPanels })
      )
    } catch {
      // The editor remains usable when storage is unavailable.
    }
  }, [collapsedPanels, collapsedPanelsStorageKey, hasLoadedCollapsedPanels])

  useEffect(
    () => () => {
      if (localCoverImageUrl.current) {
        URL.revokeObjectURL(localCoverImageUrl.current)
      }
      if (localPreviewVideoUrl.current) {
        URL.revokeObjectURL(localPreviewVideoUrl.current)
      }
      if (localPreviewVideoPosterUrl.current) {
        URL.revokeObjectURL(localPreviewVideoPosterUrl.current)
      }
      if (editorRevealTimer.current !== null) {
        window.clearTimeout(editorRevealTimer.current)
      }
      if (editorHighlightTimer.current !== null) {
        window.clearTimeout(editorHighlightTimer.current)
      }
    },
    []
  )

  useEffect(() => {
    let animationFrame = 0
    const scrollRoot = editorScrollRef.current

    const updateActiveSection = () => {
      animationFrame = 0
      const rootIsScrollable =
        scrollRoot !== null &&
        scrollRoot.scrollHeight > scrollRoot.clientHeight + 1 &&
        /auto|scroll/.test(window.getComputedStyle(scrollRoot).overflowY)
      const activationLine = rootIsScrollable
        ? (scrollRoot?.getBoundingClientRect().top ?? 0) + 112
        : 112
      let nextSection: (typeof editorSections)[number]["id"] = editorSections[0].id

      const orderedSections = document.querySelectorAll<HTMLElement>("[id^='campaign-']")
      for (const element of orderedSections) {
        if (
          editorSectionIds.has(element.id as (typeof editorSections)[number]["id"]) &&
          element.getBoundingClientRect().top <= activationLine
        ) {
          nextSection = element.id as (typeof editorSections)[number]["id"]
        }
      }

      const reachedEnd = rootIsScrollable
        ? (scrollRoot?.scrollTop ?? 0) + (scrollRoot?.clientHeight ?? 0) >=
          (scrollRoot?.scrollHeight ?? 0) - 2
        : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2

      if (reachedEnd) {
        nextSection = editorSections[editorSections.length - 1].id
      }

      setActiveEditorSection((current) => (current === nextSection ? current : nextSection))
    }

    const handleScroll = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateActiveSection)
      }
    }

    updateActiveSection()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    scrollRoot?.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      scrollRoot?.removeEventListener("scroll", handleScroll)
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  useLayoutEffect(() => {
    void previewAnimationKey

    const frame = previewFrameRef.current
    const canvas = previewCanvasRef.current
    const nextMaxWidth = previewViewport === "desktop" ? "64rem" : "340px"

    if (!frame || !canvas) {
      return
    }

    if (!previewMounted.current) {
      frame.style.maxWidth = nextMaxWidth
      previousViewport.current = previewViewport
      previewMounted.current = true
      return
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame.style.maxWidth = nextMaxWidth
      previousViewport.current = previewViewport
      return
    }

    const context = gsap.context(() => {
      if (previousViewport.current !== previewViewport) {
        frame.style.maxWidth = nextMaxWidth
        gsap.fromTo(
          frame,
          { autoAlpha: 0.65, y: 10, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }
        )
      }

      gsap.fromTo(
        canvas,
        { autoAlpha: 0, y: 12, scale: 0.99 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.46, ease: "power3.out" }
      )
    }, frame)

    previousViewport.current = previewViewport
    return () => context.revert()
  }, [previewAnimationKey, previewViewport])

  function preferredScrollBehavior(): ScrollBehavior {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
  }

  function scrollPreviewTarget(target: string) {
    window.requestAnimationFrame(() => {
      const element = previewCanvasRef.current?.querySelector<HTMLElement>(
        `[data-editor-target="${CSS.escape(target)}"]`
      )
      const scrollContainer = element?.closest<HTMLElement>(".preview-device-scroll")

      if (!element || !scrollContainer) {
        return
      }

      const containerRect = scrollContainer.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const top =
        scrollContainer.scrollTop +
        elementRect.top -
        containerRect.top -
        Math.max(20, (scrollContainer.clientHeight - elementRect.height) / 2)

      scrollContainer.scrollTo({
        top: Math.max(0, top),
        behavior: preferredScrollBehavior(),
      })
    })
  }

  function scrollEditorTarget(target: string) {
    const panel = getEditorPanelForTarget(target)
    const shouldExpand = panel ? collapsedPanels[panel] : false

    if (shouldExpand && panel) {
      setEditorPanelCollapsed(panel, false)
    }

    if (editorRevealTimer.current !== null) {
      window.clearTimeout(editorRevealTimer.current)
    }

    const revealTarget = () => {
      window.requestAnimationFrame(() => {
        const element = document.querySelector<HTMLElement>(
          `[data-preview-source="${CSS.escape(target)}"]`
        )
        const scrollRoot = editorScrollRef.current

        if (!element) {
          return
        }

        const rootIsScrollable =
          scrollRoot !== null &&
          scrollRoot.scrollHeight > scrollRoot.clientHeight + 1 &&
          /auto|scroll/.test(window.getComputedStyle(scrollRoot).overflowY)

        if (scrollRoot && rootIsScrollable) {
          const rootRect = scrollRoot.getBoundingClientRect()
          const elementRect = element.getBoundingClientRect()
          const top =
            scrollRoot.scrollTop +
            elementRect.top -
            rootRect.top -
            Math.max(72, (scrollRoot.clientHeight - elementRect.height) / 2)

          scrollRoot.scrollTo({
            top: Math.max(0, top),
            behavior: preferredScrollBehavior(),
          })
        } else {
          element.scrollIntoView({
            behavior: preferredScrollBehavior(),
            block: "center",
          })
        }

        document
          .querySelectorAll<HTMLElement>("[data-editor-highlight]")
          .forEach((highlightedElement) => {
            delete highlightedElement.dataset.editorHighlight
          })
        const highlightElement = element.matches('[data-slot="field"]')
          ? (element.querySelector<HTMLElement>(
              ':scope > input:not([type="hidden"]), :scope > textarea, :scope > [data-slot="input-group"], :scope > [data-slot="toggle-group"]'
            ) ?? element)
          : element

        void highlightElement.offsetWidth
        highlightElement.dataset.editorHighlight = "true"

        if (editorHighlightTimer.current !== null) {
          window.clearTimeout(editorHighlightTimer.current)
        }
        editorHighlightTimer.current = window.setTimeout(() => {
          delete highlightElement.dataset.editorHighlight
          editorHighlightTimer.current = null
        }, 1400)
      })
    }

    const revealDelay =
      shouldExpand && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 240 : 0

    if (revealDelay > 0) {
      editorRevealTimer.current = window.setTimeout(() => {
        editorRevealTimer.current = null
        revealTarget()
      }, revealDelay)
    } else {
      revealTarget()
    }
  }

  function selectPreviewTarget(target: string, revealEditor = false) {
    setActivePreviewTarget(target)
    scrollPreviewTarget(target)
    if (revealEditor) {
      scrollEditorTarget(target)
    }
  }

  function selectTargetFromEditor(eventTarget: EventTarget | null) {
    if (!(eventTarget instanceof Element)) {
      return
    }

    const source = eventTarget.closest<HTMLElement>("[data-preview-source]")
    const target = source?.dataset.previewSource
    if (target) {
      selectPreviewTarget(target)
    }
  }

  function handleEditorFocus(event: FocusEvent<HTMLElement>) {
    selectTargetFromEditor(event.target)
  }

  function handleEditorClick(event: MouseEvent<HTMLElement>) {
    selectTargetFromEditor(event.target)
  }

  function handlePreviewClick(event: MouseEvent<HTMLDivElement>) {
    if (previewMode !== "edit" || !(event.target instanceof Element)) {
      return
    }

    const element = event.target.closest<HTMLElement>("[data-editor-target]")
    const target = element?.dataset.editorTarget
    if (!target || !event.currentTarget.contains(element)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    selectPreviewTarget(target, true)
  }

  function scrollToEditorSection(
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: (typeof editorSections)[number]["id"]
  ) {
    event.preventDefault()
    setActiveEditorSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: preferredScrollBehavior(),
      block: "start",
    })
    window.history.replaceState(null, "", `#${sectionId}`)
  }

  function updateConfig<Key extends keyof CampaignConfig>(key: Key, value: CampaignConfig[Key]) {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  function selectTemplate(template: CampaignTemplate) {
    const preset = createCampaignConfig(template)

    setConfig((current) => ({
      ...current,
      template,
      motion: isMotionAvailableForTemplate(template, current.motion)
        ? current.motion
        : preset.motion,
      sectionOrder: preset.sectionOrder,
      header: {
        ...current.header,
        metaLabel:
          current.header.metaLabel === createCampaignConfig(current.template).header.metaLabel
            ? preset.header.metaLabel
            : current.header.metaLabel,
      },
    }))
  }

  function toggleEditorPanel(panel: EditorPanel) {
    setCollapsedPanels((current) => ({
      ...current,
      [panel]: !current[panel],
    }))
  }

  function setEditorPanelCollapsed(panel: EditorPanel, collapsed: boolean) {
    setCollapsedPanels((current) => ({
      ...current,
      [panel]: collapsed,
    }))
  }

  function clearLocalCoverImageUrl() {
    if (localCoverImageUrl.current) {
      URL.revokeObjectURL(localCoverImageUrl.current)
      localCoverImageUrl.current = null
    }
  }

  function removeCoverImage() {
    clearLocalCoverImageUrl()
    updateConfig("coverImage", "")
    updateConfig("coverImagePosition", { ...defaultCampaignImagePosition })
  }

  async function uploadCoverImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!(file.type in imageExtensionByType)) {
      toast.error("仅支持 JPG、PNG、WebP 或 AVIF 图片")
      return
    }

    if (file.size > maxCoverImageSize) {
      toast.error("图片不能超过 8 MB")
      return
    }

    setIsUploadingImage(true)

    try {
      const supabase = createSupabaseBrowserClient()

      if (!supabase || campaign.id.startsWith("demo-")) {
        clearLocalCoverImageUrl()
        const objectUrl = URL.createObjectURL(file)
        localCoverImageUrl.current = objectUrl
        updateConfig("coverImage", objectUrl)
        updateConfig("coverImagePosition", { ...defaultCampaignImagePosition })
        toast.success("图片已加载到本地预览")
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw userError ?? new Error("登录状态已失效")
      }

      const extension = imageExtensionByType[file.type as keyof typeof imageExtensionByType]
      const objectPath = `${user.id}/${campaign.id}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from("campaign-media")
        .upload(objectPath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("campaign-media").getPublicUrl(objectPath)
      clearLocalCoverImageUrl()
      updateConfig("coverImage", data.publicUrl)
      updateConfig("coverImagePosition", { ...defaultCampaignImagePosition })
      toast.success("图片上传完成")
    } catch (uploadError) {
      toast.error(getUploadErrorMessage(uploadError, "图片上传失败"))
    } finally {
      setIsUploadingImage(false)
    }
  }

  function clearLocalPreviewVideoUrl() {
    if (localPreviewVideoUrl.current) {
      URL.revokeObjectURL(localPreviewVideoUrl.current)
      localPreviewVideoUrl.current = null
    }
  }

  function clearLocalPreviewVideoPosterUrl() {
    if (localPreviewVideoPosterUrl.current) {
      URL.revokeObjectURL(localPreviewVideoPosterUrl.current)
      localPreviewVideoPosterUrl.current = null
    }
  }

  function removePreviewVideo() {
    clearLocalPreviewVideoUrl()
    clearLocalPreviewVideoPosterUrl()
    updateConfig("previewVideo", {
      ...config.previewVideo,
      autoplay: false,
      posterUrl: "",
      url: "",
    })
  }

  async function uploadPreviewVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!(file.type in videoExtensionByType)) {
      toast.error("仅支持 MP4、WebM、OGG 或 MOV 视频")
      return
    }

    if (file.size > maxPreviewVideoSize) {
      toast.error("视频不能超过 100 MB")
      return
    }

    setIsUploadingVideo(true)

    try {
      const posterBlob = await createPreviewVideoPoster(file)
      const supabase = createSupabaseBrowserClient()

      if (!supabase || campaign.id.startsWith("demo-")) {
        clearLocalPreviewVideoUrl()
        clearLocalPreviewVideoPosterUrl()
        const objectUrl = URL.createObjectURL(file)
        const posterUrl = URL.createObjectURL(posterBlob)
        localPreviewVideoUrl.current = objectUrl
        localPreviewVideoPosterUrl.current = posterUrl
        updateConfig("previewVideo", { ...config.previewVideo, posterUrl, url: objectUrl })
        toast.success("视频已加载到本地预览")
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw userError ?? new Error("登录状态已失效")
      }

      const extension = videoExtensionByType[file.type as keyof typeof videoExtensionByType]
      const objectPath = `${user.id}/${campaign.id}/${crypto.randomUUID()}.${extension}`
      const posterObjectPath = `${user.id}/${campaign.id}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from("campaign-media")
        .upload(objectPath, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      const { error: posterUploadError } = await supabase.storage
        .from("campaign-media")
        .upload(posterObjectPath, posterBlob, {
          cacheControl: "31536000",
          contentType: "image/jpeg",
          upsert: false,
        })

      if (posterUploadError) {
        throw posterUploadError
      }

      const { data } = supabase.storage.from("campaign-media").getPublicUrl(objectPath)
      const { data: posterData } = supabase.storage
        .from("campaign-media")
        .getPublicUrl(posterObjectPath)
      clearLocalPreviewVideoUrl()
      clearLocalPreviewVideoPosterUrl()
      updateConfig("previewVideo", {
        ...config.previewVideo,
        posterUrl: posterData.publicUrl,
        url: data.publicUrl,
      })
      toast.success("视频上传完成")
    } catch (uploadError) {
      toast.error(getUploadErrorMessage(uploadError, "视频上传失败"))
    } finally {
      setIsUploadingVideo(false)
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${campaign.slug}`)
      toast.success("分享链接已复制")
    } catch {
      toast.error("无法复制链接，请检查浏览器权限")
    }
  }

  const fieldError = (field: string) => state.fieldErrors?.[field]?.map((message) => ({ message }))

  return (
    <form
      id="campaign-editor-form"
      action={formAction}
      className="campaign-studio min-h-screen bg-background text-foreground"
      data-editor-mode={previewMode}
      onSubmit={handleFormSubmit}
    >
      <input type="hidden" name="campaignId" value={campaign.id} />
      <input type="hidden" name="slug" value={campaign.slug} />
      <input type="hidden" name="template" value={config.template} />
      <input type="hidden" name="slogan" value={config.slogan} />
      <input type="hidden" name="themeColor" value={config.themeColor} />
      <input type="hidden" name="motion" value={config.motion} />
      <input
        type="hidden"
        name="coverImagePosition"
        value={JSON.stringify(config.coverImagePosition)}
      />
      <input type="hidden" name="previewVideo" value={JSON.stringify(config.previewVideo)} />
      <input type="hidden" name="motionSettings" value={JSON.stringify(config.motionSettings)} />
      <input type="hidden" name="questionnaire" value={JSON.stringify(config.questionnaire)} />
      <input type="hidden" name="pageContent" value={JSON.stringify(config.pageContent)} />
      <input
        type="hidden"
        name="sectionVisibility"
        value={JSON.stringify(config.sectionVisibility)}
      />
      <input type="hidden" name="sectionOrder" value={JSON.stringify(config.sectionOrder)} />
      <input type="hidden" name="header" value={JSON.stringify(config.header)} />
      <input type="hidden" name="marquee" value={JSON.stringify(config.marquee)} />
      <input type="hidden" name="countdown" value={JSON.stringify(config.countdown)} />

      <header className="campaign-studio-header sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-background/92 px-3 py-3 backdrop-blur-md sm:px-6 min-[1180px]:pl-0 lg:pr-8">
        <div className="campaign-studio-header-leading flex min-w-0 items-center">
          <div className="campaign-studio-back-slot">
            <Link
              href="/dashboard/projects"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
              aria-label="返回项目列表"
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Link>
          </div>
          <div className="campaign-studio-header-copy min-w-0">
            <div className="flex items-center gap-2">
              <RadarIcon className="size-3.5 text-primary" aria-hidden="true" />
              <p className="truncate font-mono text-[10px] uppercase text-muted-foreground">
                Campaign Studio / {campaign.slug}
              </p>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="truncate text-sm font-medium">{name || campaign.name}</p>
              <Badge variant={campaign.status === "published" ? "default" : "secondary"}>
                {campaign.status === "published" ? "线上" : "草稿"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === "published" ? (
            <>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-white/15 bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white"
                      aria-label="复制分享链接"
                      onClick={() => void copyShareLink()}
                    />
                  }
                >
                  <CopyIcon aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>复制分享链接</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href={`/p/${campaign.slug}`}
                      target="_blank"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "border-white/15 bg-white/[0.04] text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                      aria-label="查看线上页面"
                    >
                      <ExternalLinkIcon aria-hidden="true" />
                    </Link>
                  }
                />
                <TooltipContent>查看线上页面</TooltipContent>
              </Tooltip>
            </>
          ) : null}
          <SubmitButton
            name="intent"
            value="draft"
            variant="outline"
            className="border-[#FFCC33]/35 bg-[#FFCC33]/10 text-[#FFE08A] hover:bg-[#FFCC33] hover:text-[#171407]"
            pendingLabel="保存中"
            pendingIntent={pendingIntent}
            aria-label="保存草稿"
          >
            <SaveIcon data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">保存</span>
          </SubmitButton>
          <SubmitButton
            name="intent"
            value="publish"
            className="bg-primary text-primary-foreground shadow-lg shadow-primary/10 hover:bg-primary/90"
            pendingLabel="发布中"
            pendingIntent={pendingIntent}
            aria-label="发布活动"
          >
            <SendIcon data-icon="inline-start" aria-hidden="true" />
            <span className="hidden sm:inline">发布</span>
          </SubmitButton>
        </div>
      </header>

      <main className="grid min-[1180px]:h-[calc(100svh-4rem)] min-[1180px]:min-h-0 min-[1180px]:grid-cols-[68px_360px_minmax(0,1fr)] min-[1180px]:grid-rows-[minmax(0,1fr)] min-[1180px]:overflow-hidden">
        <nav
          className="sticky top-16 hidden h-[calc(100svh-4rem)] min-h-0 flex-col border-r bg-sidebar px-2 py-5 min-[1180px]:flex min-[1180px]:h-full"
          aria-label="编辑器区块"
        >
          <p className="text-center font-mono text-[8px] uppercase text-muted-foreground">Menu</p>
          <div className="mt-4 flex flex-col gap-1">
            {editorSections.map((section) => {
              const Icon = section.icon
              const isActive = section.id === activeEditorSection

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={cn(
                    "campaign-editor-nav-link flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[9px] text-muted-foreground transition-[color,background-color,transform] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => scrollToEditorSection(event, section.id)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {section.label}
                </a>
              )
            })}
          </div>
          <div className="mt-auto border-t pt-4 text-center font-mono text-[7px] uppercase leading-relaxed text-muted-foreground">
            Draft
            <br />/ Live
          </div>
        </nav>
        <aside
          ref={editorScrollRef}
          className="min-h-0 border-b bg-background min-[1180px]:h-full min-[1180px]:overflow-y-auto min-[1180px]:overscroll-contain min-[1180px]:border-r min-[1180px]:border-b-0"
          onFocusCapture={handleEditorFocus}
          onClickCapture={handleEditorClick}
        >
          <div className="mx-auto flex max-w-2xl flex-col px-4 py-7 min-[1180px]:py-7">
            <section id="campaign-identity" className="scroll-mt-24 pb-8">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase text-primary">01 / Identity</p>
                  <h2 className="mt-1 text-base font-semibold">项目标识</h2>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  ID {campaign.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <FieldGroup>
                <Field data-invalid={Boolean(state.fieldErrors?.name)}>
                  <FieldLabelWithCount htmlFor="name" count={name.length} max={80}>
                    项目名称
                  </FieldLabelWithCount>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    aria-invalid={Boolean(state.fieldErrors?.name)}
                    required
                  />
                  <FieldDescription>仅在工作台中显示。</FieldDescription>
                  <FieldError errors={fieldError("name")} />
                </Field>
              </FieldGroup>
            </section>

            <FieldSet
              id="campaign-layout"
              className="scroll-mt-24 border-t py-8"
              data-preview-source="page-visual"
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase text-primary">02 / Layout</p>
                  <FieldLegend className="mt-1 mb-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="campaign-editor-legend-toggle"
                      aria-controls={templatePickerId}
                      aria-expanded={!collapsedPanels.template}
                      onClick={() => toggleEditorPanel("template")}
                    >
                      <span>全页模板</span>
                      <ChevronDownIcon
                        data-icon="inline-end"
                        data-open={!collapsedPanels.template}
                        aria-hidden="true"
                      />
                    </Button>
                  </FieldLegend>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {templateOptions.length} SYSTEMS
                </span>
              </div>
              <div id={templatePickerId} hidden={collapsedPanels.template}>
                <CampaignTemplatePicker
                  value={config.template}
                  onValueChange={selectTemplate}
                  className="mt-3"
                />
              </div>
            </FieldSet>

            <FieldSet className="border-t py-8">
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase text-primary">Structure / Order</p>
                  <FieldLegend className="mt-1 mb-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="campaign-editor-legend-toggle"
                      aria-controls={sectionOrganizerId}
                      aria-expanded={!collapsedPanels.sections}
                      onClick={() => toggleEditorPanel("sections")}
                    >
                      <span>页面区域</span>
                      <ChevronDownIcon
                        data-icon="inline-end"
                        data-open={!collapsedPanels.sections}
                        aria-hidden="true"
                      />
                    </Button>
                  </FieldLegend>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {activeBodySectionCount + Number(config.sectionVisibility.hero)} ACTIVE
                </span>
              </div>
              <FieldDescription className="mt-2">
                拖拽正文区域调整顺序；内容和显示开关位于对应区域。
              </FieldDescription>
              <div id={sectionOrganizerId} className="mt-4" hidden={collapsedPanels.sections}>
                <CampaignSectionOrganizer
                  order={config.sectionOrder}
                  onOrderChange={(sectionOrder) => updateConfig("sectionOrder", sectionOrder)}
                />
              </div>
            </FieldSet>

            <CampaignEditorSection
              id="campaign-header"
              code="H0"
              title="页面 Header"
              description="品牌标识与右侧信息"
              collapsed={collapsedPanels.header}
              onCollapsedChange={(collapsed) => setEditorPanelCollapsed("header", collapsed)}
              enabled={config.header.enabled}
              enabledId="header-enabled"
              enabledLabel="显示页面 Header"
              onEnabledChange={(enabled) => updateConfig("header", { ...config.header, enabled })}
            >
              <FieldGroup>
                <Field data-preview-source="header-brand">
                  <FieldLabelWithCount
                    htmlFor="header-brand-label"
                    count={config.header.brandLabel.length}
                    max={24}
                  >
                    品牌名称
                  </FieldLabelWithCount>
                  <Input
                    id="header-brand-label"
                    value={config.header.brandLabel}
                    maxLength={24}
                    onChange={(event) =>
                      updateConfig("header", {
                        ...config.header,
                        brandLabel: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field data-preview-source="header-meta">
                  <FieldLabelWithCount
                    htmlFor="header-meta-label"
                    count={config.header.metaLabel.length}
                    max={24}
                  >
                    右侧标识
                  </FieldLabelWithCount>
                  <Input
                    id="header-meta-label"
                    value={config.header.metaLabel}
                    maxLength={24}
                    placeholder="例如 LCH-01"
                    onChange={(event) =>
                      updateConfig("header", {
                        ...config.header,
                        metaLabel: event.target.value,
                      })
                    }
                  />
                </Field>
              </FieldGroup>
            </CampaignEditorSection>

            <CampaignEditorSection
              id="campaign-content"
              code="00"
              title="首屏内容"
              description="主标题、发布说明与主视觉"
              collapsed={collapsedPanels.hero}
              onCollapsedChange={(collapsed) => setEditorPanelCollapsed("hero", collapsed)}
              enabled={config.sectionVisibility.hero}
              enabledId="section-visibility-hero"
              onEnabledChange={(hero) =>
                updateConfig("sectionVisibility", { ...config.sectionVisibility, hero })
              }
            >
              <FieldGroup>
                <Field
                  data-invalid={Boolean(state.fieldErrors?.eyebrow)}
                  data-preview-source="eyebrow"
                >
                  <FieldLabelWithCount htmlFor="eyebrow" count={config.eyebrow.length} max={48}>
                    眉标题
                  </FieldLabelWithCount>
                  <Input
                    id="eyebrow"
                    name="eyebrow"
                    value={config.eyebrow}
                    onChange={(event) => updateConfig("eyebrow", event.target.value)}
                    maxLength={48}
                    aria-invalid={Boolean(state.fieldErrors?.eyebrow)}
                  />
                  <FieldError errors={fieldError("eyebrow")} />
                </Field>
                <Field data-invalid={Boolean(state.fieldErrors?.title)} data-preview-source="title">
                  <FieldLabelWithCount htmlFor="title" count={config.title.length} max={160}>
                    主标题
                  </FieldLabelWithCount>
                  <Textarea
                    id="title"
                    name="title"
                    value={config.title}
                    onChange={(event) => updateConfig("title", event.target.value)}
                    maxLength={160}
                    rows={3}
                    aria-invalid={Boolean(state.fieldErrors?.title)}
                    required
                  />
                  <FieldError errors={fieldError("title")} />
                </Field>
                <Field
                  data-invalid={Boolean(state.fieldErrors?.description)}
                  data-preview-source="description"
                >
                  <FieldLabelWithCount
                    htmlFor="description"
                    count={config.description.length}
                    max={600}
                  >
                    发布说明
                  </FieldLabelWithCount>
                  <Textarea
                    id="description"
                    name="description"
                    value={config.description}
                    onChange={(event) => updateConfig("description", event.target.value)}
                    maxLength={600}
                    rows={6}
                    aria-invalid={Boolean(state.fieldErrors?.description)}
                    required
                  />
                  <FieldError errors={fieldError("description")} />
                </Field>
                <CampaignCoverImageEditor
                  value={config.coverImage}
                  position={config.coverImagePosition}
                  errors={fieldError("coverImage")}
                  isUploading={isUploadingImage}
                  inputRef={coverImageInputRef}
                  onUpload={(event) => void uploadCoverImage(event)}
                  onRemove={removeCoverImage}
                  onChange={(value) => {
                    clearLocalCoverImageUrl()
                    updateConfig("coverImage", value)
                  }}
                  onPositionChange={(coverImagePosition) =>
                    updateConfig("coverImagePosition", coverImagePosition)
                  }
                />
              </FieldGroup>
            </CampaignEditorSection>

            <CampaignEditorSection
              id="campaign-countdown"
              code="C1"
              title="倒计时"
              description="秒级开放倒计时"
              collapsed={collapsedPanels.countdown}
              onCollapsedChange={(collapsed) => setEditorPanelCollapsed("countdown", collapsed)}
              enabled={config.countdown.enabled}
              enabledId="countdown-enabled"
              enabledLabel="显示倒计时"
              onEnabledChange={(enabled) =>
                updateConfig("countdown", updateCountdownEnabled(config.countdown, enabled))
              }
              meta={
                <span className="font-mono text-[8px] text-muted-foreground">
                  {config.countdown.enabled ? "LIVE" : "OFF"}
                </span>
              }
            >
              <FieldGroup>
                <Field data-preview-source="countdown">
                  <FieldLabelWithCount
                    htmlFor="countdown-label"
                    count={config.countdown.label.length}
                    max={40}
                  >
                    倒计时标题
                  </FieldLabelWithCount>
                  <Input
                    id="countdown-label"
                    value={config.countdown.label}
                    maxLength={40}
                    onChange={(event) =>
                      updateConfig("countdown", {
                        ...config.countdown,
                        label: event.target.value,
                      })
                    }
                  />
                </Field>
                <FieldSet
                  data-invalid={Boolean(state.fieldErrors?.countdown)}
                  data-preview-source="countdown"
                >
                  <FieldLegend variant="label">目标时间</FieldLegend>
                  <TimePicker
                    id="countdown-target"
                    value={config.countdown.targetAt}
                    aria-invalid={Boolean(state.fieldErrors?.countdown)}
                    onValueChange={(targetAt) =>
                      updateConfig("countdown", {
                        ...config.countdown,
                        targetAt,
                      })
                    }
                  />
                  <FieldDescription>
                    选择本机时区下的目标日期和精确到秒的发布时间。
                  </FieldDescription>
                  <FieldError errors={fieldError("countdown")} />
                </FieldSet>
                <Field data-preview-source="countdown">
                  <FieldLabelWithCount
                    htmlFor="countdown-complete-label"
                    count={config.countdown.completeLabel.length}
                    max={40}
                  >
                    结束文案
                  </FieldLabelWithCount>
                  <Input
                    id="countdown-complete-label"
                    value={config.countdown.completeLabel}
                    maxLength={40}
                    onChange={(event) =>
                      updateConfig("countdown", {
                        ...config.countdown,
                        completeLabel: event.target.value,
                      })
                    }
                  />
                </Field>
              </FieldGroup>
            </CampaignEditorSection>

            {config.sectionOrder.map((section, index) => {
              const code = String(index + 1).padStart(2, "0")

              if (section === "video") {
                return (
                  <CampaignEditorSection
                    key={section}
                    id="campaign-video"
                    code={code}
                    title="演示视频"
                    description="独立视频区与视口播放策略"
                    collapsed={collapsedPanels.video}
                    onCollapsedChange={(collapsed) => setEditorPanelCollapsed("video", collapsed)}
                    enabled={config.sectionVisibility.video}
                    enabledId="section-visibility-video"
                    onEnabledChange={(video) =>
                      updateConfig("sectionVisibility", {
                        ...config.sectionVisibility,
                        video,
                      })
                    }
                    meta={
                      <span className="font-mono text-[8px] text-muted-foreground">
                        {config.previewVideo.url ? "READY" : "EMPTY"}
                      </span>
                    }
                  >
                    <CampaignPreviewVideoEditor
                      value={config.previewVideo}
                      errors={fieldError("previewVideo")}
                      isUploading={isUploadingVideo}
                      inputRef={previewVideoInputRef}
                      onUpload={(event) => void uploadPreviewVideo(event)}
                      onRemove={removePreviewVideo}
                      onChange={(previewVideo) => {
                        if (previewVideo.url !== config.previewVideo.url) {
                          clearLocalPreviewVideoUrl()
                        }
                        if (previewVideo.posterUrl !== config.previewVideo.posterUrl) {
                          clearLocalPreviewVideoPosterUrl()
                        }
                        updateConfig("previewVideo", previewVideo)
                      }}
                    />
                  </CampaignEditorSection>
                )
              }

              if (section === "highlights") {
                return (
                  <CampaignEditorSection
                    key={section}
                    id="campaign-highlights"
                    code={code}
                    title="核心亮点"
                    description="能力摘要与亮点条目"
                    collapsed={collapsedPanels.highlights}
                    onCollapsedChange={(collapsed) =>
                      setEditorPanelCollapsed("highlights", collapsed)
                    }
                    enabled={config.sectionVisibility.highlights}
                    enabledId="section-visibility-highlights"
                    onEnabledChange={(highlights) =>
                      updateConfig("sectionVisibility", {
                        ...config.sectionVisibility,
                        highlights,
                      })
                    }
                    meta={
                      <span className="font-mono text-[8px] text-muted-foreground">
                        {config.pageContent.highlights.length} ITEMS
                      </span>
                    }
                  >
                    <FieldGroup>
                      <Field
                        data-invalid={Boolean(state.fieldErrors?.featureTitle)}
                        data-preview-source="feature-title"
                      >
                        <FieldLabelWithCount
                          htmlFor="feature-title"
                          count={config.featureTitle.length}
                          max={120}
                        >
                          功能标题
                        </FieldLabelWithCount>
                        <Textarea
                          id="feature-title"
                          name="featureTitle"
                          value={config.featureTitle}
                          onChange={(event) => updateConfig("featureTitle", event.target.value)}
                          maxLength={120}
                          rows={2}
                          aria-invalid={Boolean(state.fieldErrors?.featureTitle)}
                          required
                        />
                        <FieldError errors={fieldError("featureTitle")} />
                      </Field>
                      <Field
                        data-invalid={Boolean(state.fieldErrors?.featureDescription)}
                        data-preview-source="feature-description"
                      >
                        <FieldLabelWithCount
                          htmlFor="feature-description"
                          count={config.featureDescription.length}
                          max={600}
                        >
                          功能正文
                        </FieldLabelWithCount>
                        <Textarea
                          id="feature-description"
                          name="featureDescription"
                          value={config.featureDescription}
                          onChange={(event) =>
                            updateConfig("featureDescription", event.target.value)
                          }
                          maxLength={600}
                          rows={6}
                          aria-invalid={Boolean(state.fieldErrors?.featureDescription)}
                          required
                        />
                        <FieldError errors={fieldError("featureDescription")} />
                      </Field>
                      <CampaignHighlightsEditor
                        value={config.pageContent}
                        onChange={(pageContent) => updateConfig("pageContent", pageContent)}
                      />
                      <FieldError errors={fieldError("pageContent")} />
                    </FieldGroup>
                  </CampaignEditorSection>
                )
              }

              if (section === "slogan") {
                return (
                  <CampaignEditorSection
                    key={section}
                    id="campaign-slogan"
                    code={code}
                    title="滚动标语"
                    description="品牌文案与轮播节奏"
                    collapsed={collapsedPanels.slogan}
                    onCollapsedChange={(collapsed) => setEditorPanelCollapsed("slogan", collapsed)}
                    enabled={config.sectionVisibility.slogan}
                    enabledId="section-visibility-slogan"
                    onEnabledChange={(slogan) =>
                      updateConfig("sectionVisibility", {
                        ...config.sectionVisibility,
                        slogan,
                      })
                    }
                  >
                    <FieldGroup>
                      <Field
                        data-invalid={Boolean(state.fieldErrors?.slogan)}
                        data-preview-source="header-slogan"
                      >
                        <FieldLabelWithCount htmlFor="slogan" count={config.slogan.length} max={96}>
                          品牌 Slogan
                        </FieldLabelWithCount>
                        <Input
                          id="slogan"
                          value={config.slogan}
                          onChange={(event) => updateConfig("slogan", event.target.value)}
                          maxLength={96}
                          aria-invalid={Boolean(state.fieldErrors?.slogan)}
                          required
                        />
                        <FieldError errors={fieldError("slogan")} />
                      </Field>
                      <Field orientation="horizontal" data-preview-source="header-slogan">
                        <div className="min-w-0 flex-1">
                          <FieldLabel htmlFor="header-show-slogan">
                            Header 显示品牌 Slogan
                          </FieldLabel>
                          <FieldDescription>与品牌 Slogan 内容共用。</FieldDescription>
                        </div>
                        <Switch
                          id="header-show-slogan"
                          size="sm"
                          checked={config.header.showSlogan}
                          disabled={!config.header.enabled}
                          onCheckedChange={(showSlogan) =>
                            updateConfig("header", { ...config.header, showSlogan })
                          }
                        />
                      </Field>
                      <Field data-preview-source="marquee-content">
                        <FieldLabelWithCount
                          htmlFor="marquee-content"
                          count={config.marquee.content.length}
                          max={160}
                        >
                          滚动标语内容
                        </FieldLabelWithCount>
                        <Input
                          id="marquee-content"
                          value={config.marquee.content}
                          maxLength={160}
                          onChange={(event) =>
                            updateConfig("marquee", {
                              ...config.marquee,
                              content: event.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field orientation="horizontal">
                        <div className="min-w-0 flex-1">
                          <FieldLabel htmlFor="marquee-infinite">无限轮播</FieldLabel>
                          <FieldDescription>关闭后标语静态居中展示。</FieldDescription>
                        </div>
                        <Switch
                          id="marquee-infinite"
                          size="sm"
                          checked={config.marquee.infinite}
                          onCheckedChange={(infinite) =>
                            updateConfig("marquee", { ...config.marquee, infinite })
                          }
                        />
                      </Field>
                      <Field>
                        <div className="flex items-center justify-between gap-4">
                          <FieldLabel id="marquee-speed-label">轮播速度</FieldLabel>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {config.marquee.speed} 秒 / 圈
                          </span>
                        </div>
                        <Slider
                          value={config.marquee.speed}
                          min={8}
                          max={60}
                          step={1}
                          aria-labelledby="marquee-speed-label"
                          disabled={!config.marquee.infinite}
                          onValueChange={(value) => {
                            const speed = Array.isArray(value) ? value[0] : value
                            updateConfig("marquee", { ...config.marquee, speed })
                          }}
                        />
                        <FieldDescription>数值越小，滚动速度越快。</FieldDescription>
                      </Field>
                    </FieldGroup>
                  </CampaignEditorSection>
                )
              }

              if (section === "timeline") {
                return (
                  <CampaignEditorSection
                    key={section}
                    id="campaign-timeline"
                    code={code}
                    title="发布节奏"
                    description="阶段节点与开放计划"
                    collapsed={collapsedPanels.timeline}
                    onCollapsedChange={(collapsed) =>
                      setEditorPanelCollapsed("timeline", collapsed)
                    }
                    enabled={config.sectionVisibility.timeline}
                    enabledId="section-visibility-timeline"
                    onEnabledChange={(timeline) =>
                      updateConfig("sectionVisibility", {
                        ...config.sectionVisibility,
                        timeline,
                      })
                    }
                    meta={
                      <span className="font-mono text-[8px] text-muted-foreground">
                        {config.pageContent.milestones.length} STEPS
                      </span>
                    }
                  >
                    <CampaignTimelineEditor
                      value={config.pageContent}
                      onChange={(pageContent) => updateConfig("pageContent", pageContent)}
                    />
                  </CampaignEditorSection>
                )
              }

              return (
                <CampaignEditorSection
                  key={section}
                  id="campaign-signup"
                  code={code}
                  title="预约"
                  description="问卷、邮箱与提交按钮"
                  collapsed={collapsedPanels.signup}
                  onCollapsedChange={(collapsed) => setEditorPanelCollapsed("signup", collapsed)}
                  enabled={config.sectionVisibility.signup}
                  enabledId="section-visibility-signup"
                  enabledLabel="显示预约"
                  onEnabledChange={(signup) =>
                    updateConfig("sectionVisibility", {
                      ...config.sectionVisibility,
                      signup,
                    })
                  }
                  meta={
                    <span className="font-mono text-[8px] text-muted-foreground">
                      {config.questionnaire.questions.length} QUESTIONS
                    </span>
                  }
                >
                  <FieldGroup>
                    <CampaignClosingEditor
                      value={config.pageContent}
                      onChange={(pageContent) => updateConfig("pageContent", pageContent)}
                    />
                    <Field
                      data-invalid={Boolean(state.fieldErrors?.emailLabel)}
                      data-preview-source="email-label"
                    >
                      <FieldLabelWithCount
                        htmlFor="email-label"
                        count={config.emailLabel.length}
                        max={60}
                      >
                        邮箱标题
                      </FieldLabelWithCount>
                      <Input
                        id="email-label"
                        name="emailLabel"
                        value={config.emailLabel}
                        onChange={(event) => updateConfig("emailLabel", event.target.value)}
                        maxLength={60}
                        aria-invalid={Boolean(state.fieldErrors?.emailLabel)}
                        required
                      />
                      <FieldError errors={fieldError("emailLabel")} />
                    </Field>
                    <Field
                      data-invalid={Boolean(state.fieldErrors?.buttonLabel)}
                      data-preview-source="button-label"
                    >
                      <FieldLabelWithCount
                        htmlFor="button-label"
                        count={config.buttonLabel.length}
                        max={32}
                      >
                        按钮文字
                      </FieldLabelWithCount>
                      <Input
                        id="button-label"
                        name="buttonLabel"
                        value={config.buttonLabel}
                        onChange={(event) => updateConfig("buttonLabel", event.target.value)}
                        maxLength={32}
                        aria-invalid={Boolean(state.fieldErrors?.buttonLabel)}
                        required
                      />
                      <FieldError errors={fieldError("buttonLabel")} />
                    </Field>
                    <Field
                      data-invalid={Boolean(state.fieldErrors?.successMessage)}
                      data-preview-source="button-label"
                    >
                      <FieldLabelWithCount
                        htmlFor="success-message"
                        count={config.successMessage.length}
                        max={160}
                      >
                        预约成功提示
                      </FieldLabelWithCount>
                      <Textarea
                        id="success-message"
                        name="successMessage"
                        value={config.successMessage}
                        onChange={(event) => updateConfig("successMessage", event.target.value)}
                        maxLength={160}
                        rows={3}
                        aria-invalid={Boolean(state.fieldErrors?.successMessage)}
                        required
                      />
                      <FieldError errors={fieldError("successMessage")} />
                    </Field>
                    <div id="campaign-questionnaire" className="scroll-mt-32 border-t pt-6">
                      <QuestionnaireBuilder
                        questionnaire={config.questionnaire}
                        onChange={(questionnaire) => updateConfig("questionnaire", questionnaire)}
                      />
                      <FieldError errors={fieldError("questionnaire")} />
                    </div>
                  </FieldGroup>
                </CampaignEditorSection>
              )
            })}

            <FieldSet id="campaign-surface" className="scroll-mt-24 border-t pt-8">
              <div>
                <p className="font-mono text-[10px] uppercase text-primary">05 / Surface</p>
                <FieldLegend className="mt-1">视觉信号</FieldLegend>
              </div>
              <FieldGroup>
                <Field data-preview-source="page-visual">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <FieldLabel>主题色</FieldLabel>
                      <FieldDescription>16 组策展色，也可使用自定义颜色。</FieldDescription>
                    </div>
                    <Input
                      type="color"
                      value={config.themeColor}
                      onChange={(event) => updateConfig("themeColor", event.target.value)}
                      className="h-9 w-12 shrink-0 cursor-pointer p-1"
                      aria-label="自定义主题色"
                    />
                  </div>
                  <ToggleGroup
                    value={[config.themeColor]}
                    onValueChange={(values) => {
                      if (values[0]) {
                        updateConfig("themeColor", values[0])
                      }
                    }}
                    variant="outline"
                    spacing={2}
                    className="grid w-full grid-cols-8"
                    aria-label="选择主题色"
                  >
                    {themeOptions.map((theme) => (
                      <Tooltip key={theme.value}>
                        <TooltipTrigger
                          render={
                            <ToggleGroupItem
                              value={theme.value}
                              className="campaign-editor-selector-item campaign-editor-color-option aspect-square size-auto min-w-0 p-0"
                              aria-label={theme.label}
                            >
                              <span
                                className="campaign-editor-color-swatch size-5 rounded-full"
                                style={{ backgroundColor: theme.value }}
                              />
                            </ToggleGroupItem>
                          }
                        />
                        <TooltipContent>
                          {theme.label} · {theme.family}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </ToggleGroup>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    {themeOptions.find((theme) => theme.value === config.themeColor)?.label ??
                      "自定义色"}{" "}
                    / {config.themeColor}
                  </p>
                </Field>
                <Field
                  data-invalid={Boolean(state.fieldErrors?.motion)}
                  data-preview-source="page-visual"
                >
                  <FieldLabel>页面动效</FieldLabel>
                  <FieldDescription className="campaign-motion-description text-[11px]">
                    {`${selectedTemplate?.label ?? "当前模板"}提供 ${availableMotionOptions.length} 种适配动效，切换模板时会自动校正。`}
                  </FieldDescription>
                  <ToggleGroup
                    value={[config.motion]}
                    onValueChange={(values) => {
                      const nextMotion = values[0] as CampaignMotion | undefined
                      if (nextMotion) {
                        updateConfig("motion", nextMotion)
                      }
                    }}
                    variant="outline"
                    spacing={2}
                    className="grid w-full grid-cols-2"
                    aria-label="选择页面动效"
                  >
                    {availableMotionOptions.map((motion) => {
                      const MotionIcon = motionIconByValue[motion.value]

                      return (
                        <ToggleGroupItem
                          key={motion.value}
                          value={motion.value}
                          className="campaign-editor-selector-item h-auto min-w-0 items-start justify-start gap-2 px-3 py-2.5 text-left whitespace-normal"
                          aria-label={`${motion.label}：${motion.description}`}
                        >
                          <MotionIcon aria-hidden="true" />
                          <span className="min-w-0">
                            <strong className="block text-xs font-medium">{motion.label}</strong>
                            <small className="mt-0.5 block truncate font-mono text-[8px] text-muted-foreground">
                              {motion.code}
                            </small>
                          </span>
                        </ToggleGroupItem>
                      )
                    })}
                  </ToggleGroup>
                  <FieldError errors={fieldError("motion")} />
                  <div className="campaign-motion-settings">
                    <div>
                      <FieldLabel>动效强度</FieldLabel>
                      <ToggleGroup
                        value={[config.motionSettings.intensity]}
                        onValueChange={(values) => {
                          const intensity = values[0] as CampaignMotionIntensity | undefined
                          if (intensity) {
                            updateConfig("motionSettings", {
                              ...config.motionSettings,
                              intensity,
                            })
                          }
                        }}
                        variant="outline"
                        spacing={1}
                        className="mt-2 grid w-full grid-cols-3"
                        aria-label="选择动效强度"
                      >
                        {motionIntensityOptions.map((option) => (
                          <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            className="campaign-editor-selector-item min-w-0 px-2 text-xs"
                            aria-label={`${option.label}：${option.description}`}
                          >
                            {option.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <FieldLabel id="motion-speed-label">播放速度</FieldLabel>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {config.motionSettings.speed.toFixed(1)}x
                        </span>
                      </div>
                      <Slider
                        value={config.motionSettings.speed}
                        min={0.6}
                        max={1.8}
                        step={0.1}
                        aria-labelledby="motion-speed-label"
                        onValueChange={(value) => {
                          const speed = Array.isArray(value) ? value[0] : value
                          updateConfig("motionSettings", {
                            ...config.motionSettings,
                            speed,
                          })
                        }}
                      />
                    </div>
                    <div className="campaign-motion-switches">
                      {[
                        {
                          key: "entrance",
                          label: "首屏入场",
                          description: "标题和主视觉分层出现",
                        },
                        {
                          key: "scrollReveal",
                          label: "滚动揭示",
                          description: "正文随滚动进入视野",
                        },
                        {
                          key: "parallax",
                          label: "滚动视差",
                          description: "前后景产生速度差",
                        },
                        {
                          key: "ambient",
                          label: "环境动效",
                          description: "背景信号持续运动",
                        },
                      ].map((option) => {
                        const key = option.key as
                          | "ambient"
                          | "entrance"
                          | "parallax"
                          | "scrollReveal"

                        return (
                          <label key={key} htmlFor={`motion-setting-${key}`}>
                            <span>
                              <strong>{option.label}</strong>
                              <small>{option.description}</small>
                            </span>
                            <Switch
                              id={`motion-setting-${key}`}
                              size="sm"
                              checked={config.motionSettings[key]}
                              onCheckedChange={(checked) =>
                                updateConfig("motionSettings", {
                                  ...config.motionSettings,
                                  [key]: checked,
                                })
                              }
                              aria-label={option.label}
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <FieldError errors={fieldError("motionSettings")} />
                </Field>
              </FieldGroup>
            </FieldSet>

            {state.status === "error" ? (
              <Alert variant="destructive" className="mt-8">
                <AlertTitle>配置未保存</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </aside>

        <section className="studio-grid relative min-h-[720px] bg-muted/30 p-4 sm:p-7 min-[1180px]:h-full min-[1180px]:min-h-0 min-[1180px]:overflow-hidden lg:p-10">
          <div className="sticky top-24 mx-auto max-w-6xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                  <AppWindowMacIcon className="size-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Live Canvas / {selectedTemplate?.code}
                  </p>
                  <p className="text-sm font-medium">{selectedTemplate?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewMode === "edit" ? (
                  <PreviewTargetControl
                    value={activePreviewTarget}
                    onChange={(target) => selectPreviewTarget(target, true)}
                  />
                ) : (
                  <>
                    <PreviewViewportControl value={previewViewport} onChange={setPreviewViewport} />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="border border-primary/35 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                            aria-label="打开全屏预览"
                            onClick={() => setIsFullscreenPreviewOpen(true)}
                          />
                        }
                      >
                        <Maximize2Icon aria-hidden="true" />
                      </TooltipTrigger>
                      <TooltipContent>全屏预览</TooltipContent>
                    </Tooltip>
                  </>
                )}
                <PreviewModeControl
                  value={previewMode}
                  onChange={(mode) => {
                    setPreviewMode(mode)
                    if (mode === "edit") {
                      scrollPreviewTarget(activePreviewTarget)
                    }
                  }}
                />
              </div>
            </div>

            <div ref={previewFrameRef} className="mx-auto w-full">
              <div
                ref={previewCanvasRef}
                data-preview-canvas-mode={previewMode}
                onClickCapture={handlePreviewClick}
              >
                <PreviewDeviceFrame
                  config={config}
                  viewport={previewViewport}
                  slug={campaign.slug}
                  activeEditorTarget={previewMode === "edit" ? activePreviewTarget : undefined}
                  interactive={previewMode === "preview"}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isFullscreenPreviewOpen} onOpenChange={setIsFullscreenPreviewOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-dvh w-screen max-w-none flex-col gap-0 rounded-none bg-[#070909] p-0 text-white ring-0 sm:max-w-none"
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0d1111] px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <AppWindowMacIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm text-white">
                  {selectedTemplate?.label}全屏预览
                </DialogTitle>
                <p className="truncate font-mono text-[9px] text-white/40">
                  ahead.local/p/{campaign.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PreviewViewportControl
                value={previewViewport}
                onChange={setPreviewViewport}
                fullscreen
              />
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="border border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400 hover:text-red-950"
                    aria-label="关闭全屏预览"
                  />
                }
              >
                <XIcon aria-hidden="true" />
              </DialogClose>
            </div>
          </div>
          <div className="studio-grid flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6">
            <div
              className="w-full"
              data-fullscreen-preview-frame
              data-viewport={previewViewport}
              style={{
                width:
                  previewViewport === "desktop"
                    ? "min(1500px, calc(100vw - 3rem))"
                    : "min(420px, calc(100vw - 1.5rem))",
              }}
            >
              <PreviewDeviceFrame
                config={config}
                viewport={previewViewport}
                slug={campaign.slug}
                interactive
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}

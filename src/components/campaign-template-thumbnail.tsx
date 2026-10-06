"use client"

import {
  type CSSProperties,
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { CampaignPreview } from "@/components/campaign-preview"
import { getCampaignTemplateScheme } from "@/lib/campaign-template-schemes"
import { cn } from "@/lib/utils"
import type { CampaignConfig } from "@/types/database"

const templatePreviewWidth = 960

/**
 * 缩略图内部渲染一整个 CampaignPageShell（约 2300 个节点）。
 * 模板选择器一次挂载 7 个，必须依赖引用稳定的 props 才能跳过父级重渲染，
 * 否则在编辑器里逐字输入时会被反复重渲染。
 */
export const CampaignTemplateThumbnail = memo(function CampaignTemplateThumbnail({
  config,
  label,
  className,
  compact = false,
  decorative = false,
  eager = false,
}: {
  config: CampaignConfig
  label: string
  className?: string
  compact?: boolean
  decorative?: boolean
  eager?: boolean
}) {
  const scheme = getCampaignTemplateScheme(config.template)
  const [shouldRender, setShouldRender] = useState(eager)
  const previewConfig = compact
    ? {
        ...config,
        questionnaire: {
          ...config.questionnaire,
          enabled: false,
        },
        sectionVisibility: {
          hero: true,
          video: false,
          highlights: false,
          slogan: false,
          timeline: false,
          signup: false,
        },
      }
    : config
  const frameRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const instanceId = useId().replace(/[^a-zA-Z0-9-]/g, "")
  const placeholderStyle = {
    "--template-placeholder-bg": scheme.colors.background,
    "--template-placeholder-surface": scheme.colors.surface,
    "--template-placeholder-text": scheme.colors.text,
    "--template-placeholder-accent": config.themeColor,
  } as CSSProperties

  useEffect(() => {
    const frame = frameRef.current

    if (shouldRender || !frame) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true)
          observer.disconnect()
        }
      },
      { rootMargin: "320px" }
    )
    observer.observe(frame)

    return () => observer.disconnect()
  }, [shouldRender])

  useLayoutEffect(() => {
    if (!shouldRender) {
      return
    }

    const frame = frameRef.current
    const scrollContent = scrollContentRef.current
    const page = pageRef.current

    if (!frame || !scrollContent || !page) {
      return
    }

    frame.scrollTop = 0
    let animationFrame = 0
    const measure = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const frameWidth = frame.clientWidth
        const frameHeight = frame.clientHeight
        const pageHeight = page.scrollHeight

        if (frameWidth === 0 || frameHeight === 0 || pageHeight === 0) {
          return
        }

        const scale = frameWidth / templatePreviewWidth
        const scaledHeight = pageHeight * scale

        page.style.setProperty("--template-preview-scale", String(scale))
        scrollContent.style.height = `${Math.max(frameHeight, scaledHeight)}px`
        frame.dataset.ready = "true"
      })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    observer.observe(page)
    void document.fonts.ready.then(measure)
    measure()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      observer.disconnect()
    }
  }, [shouldRender])

  return (
    <div
      ref={frameRef}
      className={cn("campaign-template-thumbnail", className)}
      data-template={config.template}
      data-composition={scheme.composition}
      data-hero-media={scheme.layout.heroMedia}
      data-highlights-layout={scheme.layout.highlights}
      data-compact={compact ? "true" : undefined}
      role="img"
      style={placeholderStyle}
      aria-label={decorative ? undefined : `${label}模板缩略图`}
      aria-hidden={decorative ? true : undefined}
    >
      {shouldRender ? (
        <div
          ref={scrollContentRef}
          className="campaign-template-thumbnail-scroll-content"
          aria-hidden="true"
        >
          <div ref={pageRef} className="campaign-template-thumbnail-page">
            <CampaignPreview
              config={previewConfig}
              className="campaign-template-thumbnail-document"
              slug={`template-${config.template}-${instanceId}`}
              thumbnail
            />
          </div>
        </div>
      ) : (
        <div className="campaign-template-thumbnail-placeholder" aria-hidden="true">
          <span>{scheme.code}</span>
          <strong>{config.title}</strong>
          <i />
        </div>
      )}
    </div>
  )
})

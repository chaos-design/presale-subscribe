"use client"

import { useEffect, useRef } from "react"

import type { CampaignPreviewVideo } from "@/types/database"

export function CampaignViewportVideo({
  value,
  activeEditorTarget,
}: {
  value: CampaignPreviewVideo
  activeEditorTarget?: string
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame || !video) {
      return
    }

    if (!value.autoplay) {
      video.pause()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.35) {
          void video.play().catch(() => {
            // Native controls remain available when the browser blocks playback.
          })
        } else {
          video.pause()
        }
      },
      { threshold: [0, 0.35, 0.75] }
    )
    observer.observe(frame)

    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [value.autoplay])

  return (
    <div
      ref={frameRef}
      className="campaign-page-video-frame"
      data-editor-target="preview-video"
      data-editor-active={activeEditorTarget === "preview-video" ? true : undefined}
      data-viewport-autoplay={value.autoplay}
    >
      <video
        ref={videoRef}
        className="campaign-page-video"
        src={value.url}
        poster={value.posterUrl || undefined}
        loop={value.loop}
        muted={value.muted}
        controls
        playsInline
        preload="metadata"
        aria-label="产品预览视频"
      >
        <track kind="captions" />
      </video>
    </div>
  )
}

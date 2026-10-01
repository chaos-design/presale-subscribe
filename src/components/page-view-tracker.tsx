"use client"

import { useEffect, useRef } from "react"

import { trackPageViewAction } from "@/app/p/[slug]/actions"
import { getAnalyticsIdentifiers } from "@/lib/analytics-client"

function getDeviceType() {
  if (window.innerWidth <= 767) {
    return "mobile" as const
  }

  if (window.innerWidth <= 1100) {
    return "tablet" as const
  }

  return "desktop" as const
}

function getReferrerHost() {
  if (!document.referrer) {
    return null
  }

  try {
    const referrer = new URL(document.referrer)
    return referrer.hostname === window.location.hostname ? "internal" : referrer.hostname
  } catch {
    return null
  }
}

export function PageViewTracker({ slug }: { slug: string }) {
  const viewIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (navigator.doNotTrack === "1") {
      return
    }

    const { sessionId, visitorId } = getAnalyticsIdentifiers()
    viewIdRef.current ??= crypto.randomUUID()
    const viewId = viewIdRef.current
    const searchParams = new URLSearchParams(window.location.search)
    const referrerHost = getReferrerHost()
    let activeDurationMs = 0
    let activeStartedAt = document.hidden ? null : performance.now()
    let maxScrollDepth = 0
    let interactionCount = 0
    let scrollFrame: number | null = null
    let lastPayload = ""

    function updateScrollDepth() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      const depth =
        scrollableHeight <= 0
          ? 100
          : Math.round(
              ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
            )
      maxScrollDepth = Math.max(maxScrollDepth, Math.min(100, Math.max(0, depth)))
    }

    function getDurationSeconds() {
      const activeSegment = activeStartedAt === null ? 0 : performance.now() - activeStartedAt
      return Math.min(86400, Math.max(0, Math.round((activeDurationMs + activeSegment) / 1000)))
    }

    function flushEngagement(keepalive = false) {
      updateScrollDepth()
      const payload = JSON.stringify({
        durationSeconds: getDurationSeconds(),
        interactionCount,
        maxScrollDepth,
        slug,
        viewId,
      })

      if (payload === lastPayload) {
        return
      }

      lastPayload = payload
      void fetch("/api/analytics/engagement", {
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive,
        method: "POST",
      }).catch(() => undefined)
    }

    function pauseActiveTimer() {
      if (activeStartedAt === null) {
        return
      }

      activeDurationMs += performance.now() - activeStartedAt
      activeStartedAt = null
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        pauseActiveTimer()
        flushEngagement(true)
        return
      }

      activeStartedAt = performance.now()
    }

    function handleScroll() {
      if (scrollFrame !== null) {
        return
      }

      scrollFrame = window.requestAnimationFrame(() => {
        updateScrollDepth()
        scrollFrame = null
      })
    }

    function handleInteraction() {
      interactionCount = Math.min(10000, interactionCount + 1)
    }

    function handlePageHide() {
      pauseActiveTimer()
      flushEngagement(true)
    }

    updateScrollDepth()
    const timeoutId = window.setTimeout(() => {
      void trackPageViewAction({
        campaign: searchParams.get("utm_campaign"),
        deviceType: getDeviceType(),
        locale: navigator.language || null,
        medium: searchParams.get("utm_medium"),
        referrerHost,
        sessionId,
        slug,
        source: searchParams.get("utm_source") ?? referrerHost,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        viewId,
        visitorId,
      })
    }, 400)
    const engagementInterval = window.setInterval(() => flushEngagement(), 15000)

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("click", handleInteraction, { passive: true })
    document.addEventListener("input", handleInteraction, { passive: true })
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      pauseActiveTimer()
      flushEngagement(true)
      window.clearTimeout(timeoutId)
      window.clearInterval(engagementInterval)
      if (scrollFrame !== null) {
        window.cancelAnimationFrame(scrollFrame)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("click", handleInteraction)
      document.removeEventListener("input", handleInteraction)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [slug])

  return null
}

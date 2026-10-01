"use client"

import { gsap } from "gsap"
import { ChevronDownIcon } from "lucide-react"
import { type ReactNode, useLayoutEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"

export function DashboardTemplateShowcase({
  children,
  templateCount,
}: {
  children: ReactNode
  templateCount: number
}) {
  const [expanded, setExpanded] = useState(false)
  const showcaseRef = useRef<HTMLDivElement>(null)
  const hasMountedRef = useRef(false)

  useLayoutEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (!expanded || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const context = gsap.context(() => {
      const cards = showcaseRef.current?.querySelectorAll<HTMLElement>(":scope > article")
      if (!cards) {
        return
      }

      gsap.fromTo(
        Array.from(cards).slice(3),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.025,
          ease: "power3.out",
        }
      )
    }, showcaseRef)

    return () => context.revert()
  }, [expanded])

  return (
    <div className="dashboard-template-panel" data-expanded={expanded}>
      <div
        ref={showcaseRef}
        id="dashboard-template-showcase"
        className="dashboard-template-showcase"
      >
        {children}
      </div>
      <footer className="dashboard-template-panel-footer">
        <span>{expanded ? `正在浏览全部 ${templateCount} 套模板` : "显示精选模板"}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          aria-controls="dashboard-template-showcase"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "收起模板" : `展开全部 ${templateCount} 套`}
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </footer>
    </div>
  )
}

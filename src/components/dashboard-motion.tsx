"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { type ReactNode, useEffect, useRef } from "react"

export function DashboardMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    let context: gsap.Context | undefined
    const startFrame = window.requestAnimationFrame(() => {
      context = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return
        }

        const headingItems = gsap.utils.toArray<HTMLElement>(".dashboard-page-heading > *")
        const metricItems = gsap.utils.toArray<HTMLElement>(".dashboard-metrics > div")
        const introTimeline = gsap.timeline({ defaults: { ease: "power3.out" } })

        if (headingItems.length > 0) {
          introTimeline.from(headingItems, {
            opacity: 0,
            y: 22,
            duration: 0.62,
            stagger: 0.08,
            clearProps: "opacity,transform",
          })
        }

        if (metricItems.length > 0) {
          introTimeline.from(
            metricItems,
            {
              opacity: 0,
              y: 18,
              duration: 0.48,
              stagger: 0.07,
              clearProps: "opacity,transform",
            },
            headingItems.length > 0 ? "-=0.32" : 0
          )
        }

        const revealSections = gsap.utils.toArray<HTMLElement>(
          "[data-dashboard-reveal], .dashboard-page > section"
        )

        revealSections.forEach((section) => {
          const revealItems = section.querySelectorAll<HTMLElement>(
            ":scope > .dashboard-section-heading, :scope > header, :scope > .dashboard-project-grid > article, :scope .dashboard-template-showcase > article, :scope > ol > li"
          )
          const targets = revealItems.length > 0 ? Array.from(revealItems) : [section]

          gsap.from(targets, {
            opacity: 0,
            y: 18,
            duration: 0.68,
            stagger: 0.055,
            ease: "power3.out",
            immediateRender: false,
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
              once: true,
            },
          })
        })

        gsap.utils.toArray<HTMLElement>(".dashboard-section-heading").forEach((heading) => {
          gsap.fromTo(
            heading,
            { xPercent: -1.2 },
            {
              xPercent: 1.2,
              ease: "none",
              scrollTrigger: {
                trigger: heading,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          )
        })
      }, rootRef)

      ScrollTrigger.refresh()
    })

    return () => {
      window.cancelAnimationFrame(startFrame)
      context?.revert()
    }
  }, [])

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  )
}

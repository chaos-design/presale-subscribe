"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { type ReactNode, useLayoutEffect, useRef } from "react"

export function HomeMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return
      }

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-home-hero='nav']", { autoAlpha: 0, y: -14, duration: 0.55 })
        .from("[data-home-hero='meta']", { autoAlpha: 0, y: 16, duration: 0.5 }, "-=0.25")
        .from(
          "[data-home-hero='orbit']",
          { autoAlpha: 0, scale: 0.88, rotate: -8, duration: 1.1 },
          "-=0.45"
        )
        .from(
          "[data-home-hero='content'] > *",
          { autoAlpha: 0, y: 24, duration: 0.65, stagger: 0.1 },
          "-=0.75"
        )

      gsap.utils.toArray<HTMLElement>("[data-home-signal]").forEach((element, index) => {
        gsap.from(element, {
          autoAlpha: 0,
          x: -18,
          duration: 0.55,
          delay: index * 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 90%",
            once: true,
          },
        })
      })

      gsap.utils.toArray<HTMLElement>("[data-home-reveal]").forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          y: 28,
          duration: 0.72,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
            once: true,
          },
        })
      })

      gsap.from(".home-footer-reveal", {
        opacity: 0,
        y: 32,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "[data-home-footer='product']",
          start: "top 84%",
          once: true,
        },
      })
    }, rootRef)

    return () => context.revert()
  }, [])

  return (
    <main ref={rootRef} className="min-h-screen overflow-hidden bg-background">
      {children}
    </main>
  )
}

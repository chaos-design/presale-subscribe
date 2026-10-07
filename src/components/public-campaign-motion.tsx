"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { type ReactNode, useLayoutEffect, useRef } from "react"

import type { CampaignMotion, CampaignTemplate } from "@/types/database"

const sectionMotion: Record<
  CampaignMotion,
  {
    duration: number
    stagger: number
    x: number
    y: number
    scale: number
    rotate: number
    clipPath?: string
    filter?: string
  }
> = {
  cascade: { duration: 0.72, stagger: 0.08, x: 0, y: 42, scale: 1, rotate: 0 },
  drift: { duration: 0.9, stagger: 0.1, x: 0, y: 52, scale: 0.985, rotate: 0.35 },
  scan: {
    duration: 0.64,
    stagger: 0.07,
    x: -26,
    y: 0,
    scale: 1,
    rotate: 0,
    clipPath: "inset(0 100% 0 0)",
  },
  pulse: {
    duration: 0.7,
    stagger: 0.09,
    x: 0,
    y: 18,
    scale: 0.93,
    rotate: 0,
    filter: "blur(7px)",
  },
  kinetic: { duration: 0.58, stagger: 0.06, x: -42, y: 14, scale: 1, rotate: -1.2 },
  parallax: { duration: 0.86, stagger: 0.1, x: 0, y: 64, scale: 0.96, rotate: 0 },
}

const closingArtMotion: Record<
  CampaignTemplate,
  {
    revealX: number
    revealY: number
    layerX: number
    layerY: number
    layerRotate: number
    layerDuration: number
    spinDuration: number
    spinDirection: 1 | -1
    scanDuration: number
  }
> = {
  launch: {
    revealX: -24,
    revealY: 16,
    layerX: 18,
    layerY: -5,
    layerRotate: 2,
    layerDuration: 5.6,
    spinDuration: 20,
    spinDirection: 1,
    scanDuration: 4.2,
  },
  editorial: {
    revealX: 0,
    revealY: 24,
    layerX: 10,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 7.2,
    spinDuration: 28,
    spinDirection: -1,
    scanDuration: 6.4,
  },
  signal: {
    revealX: -34,
    revealY: 0,
    layerX: 22,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 2.8,
    spinDuration: 14,
    spinDirection: 1,
    scanDuration: 2.6,
  },
  orbit: {
    revealX: 0,
    revealY: 18,
    layerX: 8,
    layerY: -7,
    layerRotate: 1,
    layerDuration: 7.8,
    spinDuration: 24,
    spinDirection: -1,
    scanDuration: 5.8,
  },
  prism: {
    revealX: 28,
    revealY: 0,
    layerX: -22,
    layerY: 4,
    layerRotate: -1,
    layerDuration: 4.4,
    spinDuration: 18,
    spinDirection: 1,
    scanDuration: 3.8,
  },
  monolith: {
    revealX: 0,
    revealY: 32,
    layerX: 0,
    layerY: -10,
    layerRotate: 0,
    layerDuration: 5.2,
    spinDuration: 16,
    spinDirection: 1,
    scanDuration: 4.8,
  },
  atelier: {
    revealX: -20,
    revealY: 12,
    layerX: 14,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 4.8,
    spinDuration: 20,
    spinDirection: -1,
    scanDuration: 4.2,
  },
  nocturne: {
    revealX: 0,
    revealY: 28,
    layerX: 6,
    layerY: -8,
    layerRotate: 0.8,
    layerDuration: 8.6,
    spinDuration: 30,
    spinDirection: 1,
    scanDuration: 7,
  },
  kinetic: {
    revealX: -42,
    revealY: 8,
    layerX: 32,
    layerY: 0,
    layerRotate: -2,
    layerDuration: 2.6,
    spinDuration: 12,
    spinDirection: -1,
    scanDuration: 2.4,
  },
  broadsheet: {
    revealX: 0,
    revealY: 20,
    layerX: 12,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 6.8,
    spinDuration: 26,
    spinDirection: 1,
    scanDuration: 5.4,
  },
  playground: {
    revealX: 30,
    revealY: 12,
    layerX: -24,
    layerY: -8,
    layerRotate: 4,
    layerDuration: 3.4,
    spinDuration: 13,
    spinDirection: -1,
    scanDuration: 3,
  },
  ledger: {
    revealX: -26,
    revealY: 0,
    layerX: 18,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 5.8,
    spinDuration: 22,
    spinDirection: 1,
    scanDuration: 3.6,
  },
  terrain: {
    revealX: 0,
    revealY: 30,
    layerX: 12,
    layerY: -12,
    layerRotate: 0.5,
    layerDuration: 9.2,
    spinDuration: 32,
    spinDirection: -1,
    scanDuration: 7.4,
  },
  broadcast: {
    revealX: -32,
    revealY: 0,
    layerX: 20,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 3,
    spinDuration: 16,
    spinDirection: 1,
    scanDuration: 2.8,
  },
  catalog: {
    revealX: 20,
    revealY: 18,
    layerX: -14,
    layerY: 0,
    layerRotate: 0,
    layerDuration: 6.2,
    spinDuration: 24,
    spinDirection: -1,
    scanDuration: 5,
  },
  biolab: {
    revealX: 0,
    revealY: 26,
    layerX: 14,
    layerY: -10,
    layerRotate: 1.5,
    layerDuration: 8.2,
    spinDuration: 26,
    spinDirection: 1,
    scanDuration: 6.8,
  },
}

export function PublicCampaignMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const generatedArtworkNodes: SVGGeometryElement[] = []
    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return
      }

      const campaignPage = rootRef.current?.querySelector<HTMLElement>(".campaign-page")
      const motion = (campaignPage?.dataset.motion ?? "cascade") as CampaignMotion
      const revealMotion = sectionMotion[motion]
      const ambient = campaignPage?.dataset.motionAmbient !== "false"
      const entrance = campaignPage?.dataset.motionEntrance !== "false"
      const parallax = campaignPage?.dataset.motionParallax !== "false"
      const scrollReveal = campaignPage?.dataset.motionScrollReveal !== "false"
      const motionSpeed = Math.min(
        1.8,
        Math.max(0.6, Number(campaignPage?.dataset.motionSpeed) || 1)
      )
      const intensity =
        campaignPage?.dataset.motionIntensity === "subtle"
          ? 0.6
          : campaignPage?.dataset.motionIntensity === "bold"
            ? 1.4
            : 1
      const compactMotion = window.matchMedia("(max-width: 720px)").matches
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
      const headerItems = rootRef.current?.querySelectorAll("main > header > *") ?? []
      const heroTitle = rootRef.current?.querySelector(".campaign-public-title")
      const heroCopy = rootRef.current?.querySelector<HTMLElement>(".campaign-page-hero-copy")
      const heroCopyItems =
        rootRef.current?.querySelectorAll(
          ".campaign-page-kicker, .campaign-page-hero-copy > p, .campaign-page-hero-status"
        ) ?? []
      const heroVisualItems =
        rootRef.current?.querySelectorAll(
          ".campaign-page-hero-visual, .campaign-page-scroll-cue"
        ) ?? []
      const heroAtmosphereItems =
        rootRef.current?.querySelectorAll<HTMLElement>(".campaign-page-hero-atmosphere > span") ??
        []

      if (entrance) {
        if (headerItems.length > 0) {
          timeline.from(headerItems, {
            autoAlpha: 0,
            y: -12 * intensity,
            duration: 0.5,
            stagger: 0.08,
          })
        }
        if (heroTitle) {
          timeline.from(
            heroTitle,
            {
              autoAlpha: 0,
              y: 52 * intensity,
              clipPath: "inset(0 0 100% 0)",
              duration: 0.9,
            },
            headerItems.length > 0 ? "-=0.2" : 0
          )
        }
        if (heroCopyItems.length > 0) {
          timeline.from(
            heroCopyItems,
            {
              autoAlpha: 0,
              y: 18 * intensity,
              duration: 0.55,
              stagger: 0.09,
            },
            heroTitle ? "-=0.5" : 0
          )
        }
        if (heroVisualItems.length > 0) {
          timeline.from(
            heroVisualItems,
            {
              autoAlpha: 0,
              scale: 1 - 0.04 * intensity,
              clipPath: "inset(5% 5% 5% 5%)",
              duration: 0.85,
              stagger: 0.08,
            },
            heroTitle ? "-=0.72" : 0
          )
        }
        if (heroAtmosphereItems.length > 0) {
          timeline.from(
            heroAtmosphereItems,
            {
              autoAlpha: 0,
              scale: 1 - 0.28 * intensity,
              duration: 0.8,
              stagger: 0.12,
            },
            heroTitle ? "-=0.75" : 0
          )
        }
        timeline.timeScale(motionSpeed)
      }

      if (ambient && heroAtmosphereItems.length > 0) {
        gsap.to(heroAtmosphereItems, {
          x: (index) => (compactMotion ? 5 : 10) * intensity * (index % 2 === 0 ? 1 : -1),
          y: (index) => (compactMotion ? 7 : 14) * intensity * (index === 1 ? -1 : 1),
          rotate: (index) => (index % 2 === 0 ? 6 : -6) * intensity,
          duration: (index) => (4.8 + index * 1.4) / motionSpeed,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          stagger: 0.35,
          force3D: true,
        })
      }

      const nocturneRings =
        rootRef.current?.querySelectorAll<HTMLElement>(
          '.campaign-page[data-template="nocturne"] .campaign-page-art > span'
        ) ?? []
      if (ambient && nocturneRings.length > 0) {
        gsap.to(nocturneRings, {
          rotate: (index) => (index % 2 === 0 ? 360 : -360),
          duration: (index) => (18 + index * 5) / motionSpeed,
          repeat: -1,
          ease: "none",
          transformOrigin: "center center",
          force3D: true,
        })
      }

      if (scrollReveal) {
        gsap.utils.toArray<HTMLElement>("[data-campaign-reveal]").forEach((section) => {
          const revealItems = section.querySelectorAll(
            ":scope > header, :scope > .campaign-page-section-index, :scope > .campaign-page-video-frame, :scope > .campaign-page-video-meta, :scope > .campaign-page-countdown-copy, :scope > .campaign-page-countdown-grid, :scope article, :scope li, :scope > .campaign-page-closing-grid"
          )

          gsap.from(revealItems, {
            autoAlpha: 0,
            x:
              motion === "kinetic"
                ? (index) => (index % 2 === 0 ? -42 : 42) * intensity
                : revealMotion.x * intensity,
            y: revealMotion.y * intensity,
            scale: 1 - (1 - revealMotion.scale) * intensity,
            rotate:
              motion === "kinetic"
                ? (index) => (index % 2 === 0 ? -1.2 : 1.2) * intensity
                : revealMotion.rotate * intensity,
            clipPath: revealMotion.clipPath,
            filter: revealMotion.filter,
            duration: revealMotion.duration / motionSpeed,
            stagger: revealMotion.stagger / motionSpeed,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 84%",
              once: true,
            },
          })
        })
      }

      const hero = rootRef.current?.querySelector(".campaign-page-hero")
      if (parallax && heroCopy && hero) {
        gsap.to(heroCopy, {
          yPercent: (compactMotion ? -4 : -9) * intensity,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: compactMotion ? 0.45 : 0.8,
          },
        })
      }

      if (parallax && heroAtmosphereItems.length > 0 && hero) {
        gsap.to(heroAtmosphereItems, {
          yPercent: (index) => (compactMotion ? 16 : 30) * intensity * (index % 2 === 0 ? -1 : 1),
          xPercent: (index) => (compactMotion ? 5 : 10) * intensity * (index === 1 ? -1 : 1),
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: compactMotion ? 0.6 : 1,
          },
        })
      }

      const pageGrid = rootRef.current?.querySelector<HTMLElement>(".campaign-page-grid")
      if (parallax && pageGrid && campaignPage) {
        // 位移量与原 background-position 动画一致（36px/72px），但只驱动 transform，
        // 由合成器处理，避免逐帧重绘整页高度的蒙版渐变。inset:-96px 保证不露边。
        gsap.fromTo(
          pageGrid,
          { x: 0, y: 0 },
          {
            x: motion === "kinetic" ? 72 : 36,
            y: motion === "kinetic" ? -36 : 72,
            ease: "none",
            scrollTrigger: {
              trigger: campaignPage,
              start: "top top",
              end: "bottom bottom",
              scrub: motion === "scan" ? 0.25 : 1,
            },
          }
        )
      }

      const heroImage = rootRef.current?.querySelector<HTMLElement>(".campaign-page-image img")
      if (parallax && heroImage) {
        gsap.fromTo(
          heroImage,
          { yPercent: -4 * intensity, scale: 1 + 0.06 * intensity },
          {
            yPercent: 4 * intensity,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ".campaign-page-hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.7,
            },
          }
        )
      }

      const heroArt = rootRef.current?.querySelector<HTMLElement>(".campaign-page-art")
      if (parallax && heroArt) {
        gsap.fromTo(
          heroArt,
          { yPercent: -3 * intensity, rotate: -1 * intensity },
          {
            yPercent: 5 * intensity,
            rotate: intensity,
            ease: "none",
            scrollTrigger: {
              trigger: ".campaign-page-hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        )
      }

      const scrollCue = rootRef.current?.querySelector(".campaign-page-scroll-cue")
      if (parallax && scrollCue && hero) {
        gsap.to(scrollCue, {
          autoAlpha: 0,
          y: 12,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "35% top",
            scrub: true,
          },
        })
      }

      gsap.utils.toArray<HTMLElement>(".campaign-page-section-index").forEach((index) => {
        const line = index.querySelector("i")
        const section = index.closest("section")
        if (!line || !section) {
          return
        }

        if (scrollReveal) {
          gsap.from(line, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.9 / motionSpeed,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              once: true,
            },
          })
        }

        if (parallax) {
          gsap.fromTo(
            index,
            { xPercent: -1.5 * intensity },
            {
              xPercent: 1.5 * intensity,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          )
        }
      })

      const timelineList = rootRef.current?.querySelector(".campaign-page-timeline ol")
      const timelineLines =
        timelineList?.querySelectorAll(".campaign-page-timeline li > div i") ?? []
      if (scrollReveal && timelineList && timelineLines.length > 0) {
        gsap.from(timelineLines, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.7 / motionSpeed,
          stagger: 0.12 / motionSpeed,
          ease: "power3.out",
          scrollTrigger: {
            trigger: timelineList,
            start: "top 86%",
            once: true,
          },
        })
      }

      const highlightSignals =
        rootRef.current?.querySelectorAll<HTMLElement>(".campaign-page-highlights article > i") ??
        []
      if (scrollReveal && highlightSignals.length > 0) {
        gsap.from(highlightSignals, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.65 / motionSpeed,
          stagger: 0.1 / motionSpeed,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".campaign-page-highlights",
            start: "top 84%",
            once: true,
          },
        })
      }

      const timelineMarkers =
        rootRef.current?.querySelectorAll<HTMLElement>(".campaign-page-timeline li > div strong") ??
        []
      if (scrollReveal && timelineMarkers.length > 0) {
        gsap.from(timelineMarkers, {
          autoAlpha: 0,
          scale: 1 - 0.45 * intensity,
          rotate: motion === "kinetic" ? -14 * intensity : 0,
          duration: 0.5 / motionSpeed,
          stagger: 0.11 / motionSpeed,
          ease: "back.out(1.8)",
          scrollTrigger: {
            trigger: ".campaign-page-timeline ol",
            start: "top 86%",
            once: true,
          },
        })
      }

      const template = (campaignPage?.dataset.template ?? "launch") as CampaignTemplate
      const artworkMotion = closingArtMotion[template]
      const closingArtwork =
        rootRef.current?.querySelectorAll<HTMLElement>("[data-campaign-closing-art]") ?? []

      closingArtwork.forEach((artwork) => {
        const direction = 1
        const motif = artwork.querySelector<SVGGElement>(".campaign-closing-artwork-motif")
        const layers = artwork.querySelectorAll<SVGGElement>("[data-closing-art-layer]")
        const drawPaths = artwork.querySelectorAll<SVGGeometryElement>("[data-closing-art-draw]")
        const spinningGroups = artwork.querySelectorAll<SVGGElement>("[data-closing-art-spin]")
        const pulses = artwork.querySelectorAll<SVGElement>("[data-closing-art-pulse]")
        const scans = artwork.querySelectorAll<SVGElement>("[data-closing-art-scan]")
        const tracers = ambient
          ? Array.from(drawPaths).flatMap((path) => {
              const parent = path.parentNode

              if (!parent) {
                return []
              }

              const tracer = path.cloneNode(false) as SVGGeometryElement
              tracer.removeAttribute("data-closing-art-draw")
              tracer.setAttribute("data-closing-art-tracer", "")
              tracer.setAttribute("pathLength", "1")
              tracer.setAttribute("fill", "none")
              tracer.setAttribute("stroke", "var(--campaign-color)")
              tracer.setAttribute("stroke-width", compactMotion ? "1.8" : "2.4")
              tracer.setAttribute("vector-effect", "non-scaling-stroke")
              parent.appendChild(tracer)
              generatedArtworkNodes.push(tracer)

              return [tracer]
            })
          : []
        const artworkTimeline = gsap.timeline(
          scrollReveal
            ? {
                scrollTrigger: {
                  trigger: artwork,
                  start: "top 94%",
                  once: true,
                },
              }
            : {}
        )

        if (scrollReveal) {
          artworkTimeline.from(artwork, {
            autoAlpha: 0,
            x: artworkMotion.revealX * direction * intensity,
            y: artworkMotion.revealY * intensity,
            clipPath:
              Math.abs(artworkMotion.revealX) > artworkMotion.revealY
                ? direction > 0
                  ? "inset(0 100% 0 0)"
                  : "inset(0 0 0 100%)"
                : "inset(100% 0 0 0)",
            duration: 0.78 / motionSpeed,
            ease: "power3.out",
          })

          if (drawPaths.length > 0) {
            artworkTimeline.fromTo(
              drawPaths,
              { strokeDasharray: 1, strokeDashoffset: 1 },
              {
                strokeDashoffset: 0,
                duration: 1.1 / motionSpeed,
                stagger: 0.1 / motionSpeed,
                ease: "power2.inOut",
              },
              "-=0.48"
            )
          }
        }

        if (ambient && tracers.length > 0) {
          gsap.fromTo(
            tracers,
            {
              autoAlpha: 0,
              attr: {
                "stroke-dasharray": "0.001 0.999",
                "stroke-dashoffset": artworkMotion.spinDirection,
              },
            },
            {
              autoAlpha: 0.92,
              attr: {
                "stroke-dasharray": "0.14 0.86",
                "stroke-dashoffset": artworkMotion.spinDirection * -1,
              },
              duration: Math.max(2.4, artworkMotion.scanDuration) / motionSpeed,
              repeat: -1,
              ease: "none",
              stagger: 0.18,
            }
          )
        }

        if (ambient && motif) {
          gsap.to(motif, {
            x: artworkMotion.layerX * (compactMotion ? 0.08 : 0.14) * intensity,
            y: artworkMotion.layerY * (compactMotion ? 0.18 : 0.28) * intensity,
            rotate: artworkMotion.layerRotate * 0.18 * intensity,
            duration: (artworkMotion.layerDuration * 1.3) / motionSpeed,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            transformOrigin: "center center",
            force3D: true,
          })
        }

        if (layers.length > 0) {
          if (scrollReveal) {
            artworkTimeline.from(
              layers,
              {
                autoAlpha: 0,
                scale: 1 - 0.1 * intensity,
                transformOrigin: "center center",
                duration: 0.58 / motionSpeed,
                stagger: 0.08 / motionSpeed,
                ease: "back.out(1.5)",
              },
              "-=0.72"
            )
          }

          if (ambient) {
            gsap.to(layers, {
              x: artworkMotion.layerX * direction * intensity,
              y: artworkMotion.layerY * intensity,
              rotate: artworkMotion.layerRotate * direction * intensity,
              duration: artworkMotion.layerDuration / motionSpeed,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              stagger: 0.16,
              force3D: true,
            })
          }
        }

        if (ambient && spinningGroups.length > 0) {
          gsap.to(spinningGroups, {
            rotate: 360 * artworkMotion.spinDirection * direction,
            duration: artworkMotion.spinDuration / motionSpeed,
            repeat: -1,
            ease: "none",
            transformOrigin: "center center",
            force3D: true,
          })
        }

        if (ambient && pulses.length > 0) {
          gsap.to(pulses, {
            scale: 1 + 0.45 * intensity,
            opacity: 0.52,
            duration: Math.max(1.3, artworkMotion.layerDuration * 0.34) / motionSpeed,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            transformOrigin: "center center",
          })
        }

        if (ambient && scans.length > 0) {
          gsap.fromTo(
            scans,
            { xPercent: -34 * direction * intensity, opacity: 0.15 },
            {
              xPercent: 34 * direction * intensity,
              opacity: 0.9,
              duration: artworkMotion.scanDuration / motionSpeed,
              repeat: -1,
              yoyo: true,
              ease: template === "signal" || template === "broadcast" ? "steps(8)" : "sine.inOut",
            }
          )
        }
      })

      const questionnaire = rootRef.current?.querySelector(".campaign-questionnaire")
      if (scrollReveal && questionnaire) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: questionnaire,
              start: "top 90%",
              once: true,
            },
          })
          .from(questionnaire, {
            autoAlpha: 0,
            y: 24 * intensity,
            duration: 0.58 / motionSpeed,
            ease: "power3.out",
          })
          .from(
            "[data-public-question]",
            {
              autoAlpha: 0,
              x: -14 * intensity,
              duration: 0.4 / motionSpeed,
              stagger: 0.08 / motionSpeed,
              ease: "power3.out",
            },
            "-=0.3"
          )
          .from(
            ".campaign-subscribe-email-panel",
            {
              autoAlpha: 0,
              y: 12 * intensity,
              duration: 0.42 / motionSpeed,
              ease: "power3.out",
            },
            "-=0.18"
          )
      } else if (scrollReveal) {
        const emailPanel = rootRef.current?.querySelector(".campaign-subscribe-email-panel")
        if (emailPanel) {
          gsap.from(emailPanel, {
            autoAlpha: 0,
            y: 14 * intensity,
            duration: 0.48 / motionSpeed,
            delay: 0.3,
            ease: "power3.out",
          })
        }
      }

      const footer = rootRef.current?.querySelector(".campaign-page-footer")
      if (scrollReveal && footer) {
        gsap.from(footer.children, {
          autoAlpha: 0,
          y: 14 * intensity,
          duration: 0.5 / motionSpeed,
          stagger: 0.08 / motionSpeed,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 94%",
            once: true,
          },
        })
      }
    }, rootRef)

    return () => {
      context.revert()
      generatedArtworkNodes.forEach((node) => {
        node.remove()
      })
    }
  }, [])

  return (
    <div ref={rootRef} className="contents">
      {children}
    </div>
  )
}

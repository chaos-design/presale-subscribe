"use client"

import { gsap } from "gsap"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PauseIcon, PlayIcon } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { CampaignTemplateThumbnail } from "@/components/campaign-template-thumbnail"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { createCampaignConfig, templateOptions } from "@/lib/campaign-presets"
import { cn } from "@/lib/utils"

const slideDuration = 6

export function PageSystemsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const slideRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const progressTweenRef = useRef<gsap.core.Tween | null>(null)
  const directionRef = useRef(1)
  const isPausedRef = useRef(isPaused)
  const activeOption = templateOptions[activeIndex]
  const activeConfig = createCampaignConfig(activeOption.value)
  const animationKey = activeOption.value

  function selectSlide(index: number, direction = index > activeIndex ? 1 : -1) {
    if (index === activeIndex) {
      progressTweenRef.current?.restart()
      return
    }

    directionRef.current = direction
    setActiveIndex(index)
  }

  function showPrevious() {
    const nextIndex = (activeIndex - 1 + templateOptions.length) % templateOptions.length
    selectSlide(nextIndex, -1)
  }

  function showNext() {
    const nextIndex = (activeIndex + 1) % templateOptions.length
    selectSlide(nextIndex, 1)
  }

  useLayoutEffect(() => {
    void animationKey

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        slideRef.current,
        { autoAlpha: 0, x: directionRef.current * 42, scale: 0.985 },
        { autoAlpha: 1, x: 0, scale: 1, duration: 0.58, ease: "power3.out" }
      )

      progressTweenRef.current = gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: slideDuration,
          ease: "none",
          paused: isPausedRef.current,
          onComplete: () => {
            directionRef.current = 1
            setActiveIndex((current) => (current + 1) % templateOptions.length)
          },
        }
      )
    }, rootRef)

    return () => context.revert()
  }, [animationKey])

  useEffect(() => {
    isPausedRef.current = isPaused

    if (isPaused) {
      progressTweenRef.current?.pause()
    } else {
      progressTweenRef.current?.resume()
    }
  }, [isPaused])

  useEffect(() => {
    const root = rootRef.current
    const viewport = root?.querySelector<HTMLElement>(
      '.home-template-strip [data-slot="scroll-area-viewport"]'
    )
    const activeItem = root?.querySelector<HTMLElement>(`[data-template-index="${activeIndex}"]`)

    if (!viewport || !activeItem) {
      return
    }

    const targetLeft = activeItem.offsetLeft - (viewport.clientWidth - activeItem.offsetWidth) / 2
    viewport.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [activeIndex])

  return (
    <section
      ref={rootRef}
      className="mt-8"
      aria-roledescription="carousel"
      aria-label="页面系统"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          showPrevious()
        } else if (event.key === "ArrowRight") {
          showNext()
        }
      }}
    >
      <div className="home-page-system-console overflow-hidden rounded-md bg-[#090b0a] ring-1 ring-background/20">
        <div className="flex h-10 items-center gap-3 border-b border-white/10 bg-[#111412] px-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-[#ff5f57]" />
            <span className="size-2 rounded-full bg-[#febc2e]" />
            <span className="size-2 rounded-full bg-[#28c840]" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-sm bg-black/25 px-3 py-1 font-mono text-[9px] text-white/40">
            ahead.page/release/{activeOption.value}
          </div>
          <span className="hidden font-mono text-[8px] uppercase text-white/35 sm:block">
            {activeOption.code} / COVER
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article
            ref={slideRef}
            className="min-w-0"
            aria-roledescription="slide"
            aria-live={isPaused ? "polite" : "off"}
            aria-label={`${activeOption.label}，第 ${activeIndex + 1} 张，共 ${templateOptions.length} 张`}
          >
            <CampaignTemplateThumbnail
              key={activeOption.value}
              config={activeConfig}
              label={activeOption.label}
              className="home-template-cover"
              eager
            />
          </article>

          <div className="flex min-h-72 flex-col justify-between border-t border-white/10 bg-[#111412] p-5 text-white lg:border-t-0 lg:border-l lg:p-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[10px] uppercase text-white/48">
                  {activeOption.code}
                </span>
                <span className="font-display text-5xl leading-none text-white/18">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <CampaignTemplateThumbnail
                  config={activeConfig}
                  label={activeOption.label}
                  className="size-12 shrink-0 rounded-sm"
                  compact
                  decorative
                />
                <h3 className="text-2xl font-semibold">{activeOption.label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/58">
                以{activeOption.description}建立第一印象，让访客在正式开放前看懂正在靠近的变化。
              </p>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="上一套页面系统"
                  onClick={showPrevious}
                >
                  <ArrowLeftIcon aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={isPaused ? "继续自动轮播" : "暂停自动轮播"}
                  onClick={() => setIsPaused((current) => !current)}
                >
                  {isPaused ? <PlayIcon aria-hidden="true" /> : <PauseIcon aria-hidden="true" />}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label="下一套页面系统"
                  onClick={showNext}
                >
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
                <span className="ml-auto font-mono text-[9px] text-white/38">
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(templateOptions.length).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-5 h-px overflow-hidden bg-white/12">
                <span
                  ref={progressRef}
                  className="block h-full origin-left bg-white"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="home-template-strip mt-4 pb-3">
        <div className="flex w-max min-w-full gap-2">
          {templateOptions.map((option, index) => {
            const isActive = index === activeIndex
            const config = createCampaignConfig(option.value)

            return (
              <button
                key={option.value}
                type="button"
                data-template-index={index}
                className={cn(
                  "group flex w-44 shrink-0 items-center gap-2 rounded-sm p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  isActive ? "bg-background/14" : "bg-background/[0.04] hover:bg-background/10"
                )}
                aria-label={`显示${option.label}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => selectSlide(index)}
              >
                <CampaignTemplateThumbnail
                  config={config}
                  label={option.label}
                  className="h-9 w-12 shrink-0 rounded-sm"
                  compact
                  decorative
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-mono text-[8px]",
                      isActive ? "text-white" : "text-white/35"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")} / {option.code}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block truncate text-xs",
                      isActive ? "font-medium text-white" : "text-white/55"
                    )}
                  >
                    {option.label}
                  </span>
                </span>
                {isActive ? <CheckIcon className="shrink-0 text-white" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

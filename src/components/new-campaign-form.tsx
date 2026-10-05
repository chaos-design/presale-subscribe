"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { AppWindowMacIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { createCampaignAction } from "@/app/dashboard/actions"
import { CampaignPreview } from "@/components/campaign-preview"
import { CampaignTemplatePicker } from "@/components/campaign-template-picker"
import { SubmitButton } from "@/components/submit-button"
import { buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createCampaignConfig, templateOptions } from "@/lib/campaign-presets"
import type { CampaignTemplate } from "@/types/database"

export function NewCampaignForm({ initialTemplate }: { initialTemplate: CampaignTemplate }) {
  const [template, setTemplate] = useState<CampaignTemplate>(initialTemplate)
  const formRef = useRef<HTMLFormElement>(null)
  const selectedTemplate =
    templateOptions.find((option) => option.value === template) ?? templateOptions[0]
  const config = createCampaignConfig(template)
  const motionScope = template

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const root = formRef.current
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }

    root.dataset.motionScope = motionScope
    let context: gsap.Context | undefined
    const startFrame = window.requestAnimationFrame(() => {
      context = gsap.context(() => {
        const templateList = root.querySelector<HTMLElement>(".new-campaign-template-list")
        const previewCanvas = root.querySelector<HTMLElement>(".new-campaign-preview-canvas")
        const previewPage = previewCanvas?.querySelector<HTMLElement>(".campaign-page")
        const progress = root.querySelector<HTMLElement>(".new-campaign-browser-progress")
        const visibleTemplateItems = Array.from(
          root.querySelectorAll<HTMLElement>(".new-campaign-template-option")
        ).filter((item) => getComputedStyle(item).display !== "none")

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(".new-campaign-name-field", {
            opacity: 0,
            y: 12,
            duration: 0.42,
            clearProps: "opacity,transform",
          })
          .from(
            visibleTemplateItems,
            {
              opacity: 0,
              y: 12,
              duration: 0.34,
              stagger: 0.025,
              clearProps: "opacity,transform",
            },
            "-=0.2"
          )
          .from(
            ".new-campaign-browser",
            {
              opacity: 0,
              scale: 0.985,
              duration: 0.58,
              clearProps: "opacity,transform",
            },
            "-=0.45"
          )

        if (templateList && templateList.scrollHeight > templateList.clientHeight) {
          Array.from(
            templateList.querySelectorAll<HTMLElement>(".new-campaign-template-option")
          ).forEach((item) => {
            gsap.fromTo(
              item.querySelector(".new-campaign-template-swatch"),
              { yPercent: -5 },
              {
                yPercent: 5,
                ease: "none",
                scrollTrigger: {
                  trigger: item,
                  scroller: templateList,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.7,
                },
              }
            )
          })
        }

        if (previewCanvas && previewPage) {
          previewCanvas
            .querySelectorAll<HTMLElement>("[data-campaign-reveal]")
            .forEach((section) => {
              const targets = section.querySelectorAll<HTMLElement>(
                ":scope > header, :scope > .campaign-page-section-index, :scope article, :scope li, :scope > .campaign-page-closing-grid"
              )

              if (targets.length > 0) {
                gsap.from(targets, {
                  opacity: 0,
                  y: 22,
                  duration: 0.55,
                  stagger: 0.055,
                  ease: "power3.out",
                  immediateRender: false,
                  clearProps: "opacity,transform",
                  scrollTrigger: {
                    trigger: section,
                    scroller: previewCanvas,
                    start: "top 88%",
                    once: true,
                  },
                })
              }
            })

          const heroImage = previewCanvas.querySelector<HTMLElement>(".campaign-page-image img")
          if (heroImage) {
            gsap.fromTo(
              heroImage,
              { yPercent: -3, scale: 1.035 },
              {
                yPercent: 4,
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: ".campaign-page-hero",
                  scroller: previewCanvas,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.65,
                },
              }
            )
          }

          if (progress) {
            gsap.fromTo(
              progress,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: previewPage,
                  scroller: previewCanvas,
                  start: "top top",
                  end: "bottom bottom",
                  scrub: 0.25,
                },
              }
            )
          }
        }
      }, root)

      ScrollTrigger.refresh()
    })

    return () => {
      window.cancelAnimationFrame(startFrame)
      context?.revert()
      delete root.dataset.motionScope
    }
  }, [motionScope])

  return (
    <form ref={formRef} action={createCampaignAction} className="new-campaign-layout">
      <input type="hidden" name="template" value={template} />
      <section className="new-campaign-controls">
        <Field className="new-campaign-name-field">
          <FieldLabel htmlFor="campaign-name">项目名称</FieldLabel>
          <Input
            id="campaign-name"
            name="name"
            placeholder="例如：移动端 3.0 发布"
            minLength={2}
            maxLength={80}
            autoFocus
            required
          />
        </Field>

        <FieldSet className="new-campaign-template-fieldset">
          <FieldLegend variant="label" className="new-campaign-template-legend">
            全页模板
          </FieldLegend>
          <FieldDescription className="new-campaign-template-description">
            选择起点，创建后仍可在编辑器中切换。
          </FieldDescription>
          <CampaignTemplatePicker
            id="new-campaign-template-list"
            value={template}
            onValueChange={setTemplate}
            className="new-campaign-template-list"
          />
        </FieldSet>

        <div className="new-campaign-actions flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Link href="/dashboard/projects" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
            取消
          </Link>
          <SubmitButton pendingLabel="正在创建">创建并进入编辑</SubmitButton>
        </div>
      </section>

      <aside className="new-campaign-preview-pane">
        <div className="new-campaign-preview-heading">
          <div>
            <p className="text-sm font-medium">{selectedTemplate.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{selectedTemplate.description}</p>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {selectedTemplate.code}
          </span>
        </div>
        <div className="new-campaign-browser">
          <div className="new-campaign-browser-toolbar">
            <i
              className="new-campaign-browser-progress"
              aria-hidden="true"
              style={{ backgroundColor: config.themeColor }}
            />
            <div className="new-campaign-browser-lights" aria-hidden="true">
              <span className="new-campaign-browser-light-close" />
              <span className="new-campaign-browser-light-minimize" />
              <span className="new-campaign-browser-light-maximize" />
            </div>
            <AppWindowMacIcon aria-hidden="true" />
            <div className="new-campaign-browser-address">
              <span>reps.local/p/preview</span>
            </div>
            <span>{selectedTemplate.code}</span>
          </div>
          <div className="new-campaign-preview-canvas">
            <CampaignPreview config={config} interactive showQuestionnaire />
          </div>
          <div className="new-campaign-browser-status">
            <span>Preview / Responsive</span>
            <span style={{ color: config.themeColor }}>● Live canvas</span>
          </div>
        </div>
      </aside>
    </form>
  )
}

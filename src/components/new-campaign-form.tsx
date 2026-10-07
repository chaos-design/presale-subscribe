"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { AppWindowMacIcon, ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"

import { createCampaignAction } from "@/app/dashboard/actions"
import { CampaignPreview } from "@/components/campaign-preview"
import { CampaignTemplatePicker } from "@/components/campaign-template-picker"
import { SubmitButton } from "@/components/submit-button"
import { buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getTemplatePresetConfig, templateOptions } from "@/lib/campaign-presets"
import type { CampaignTemplate } from "@/types/database"

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function NewCampaignForm({ initialTemplate }: { initialTemplate: CampaignTemplate }) {
  const [template, setTemplate] = useState<CampaignTemplate>(initialTemplate)
  const formRef = useRef<HTMLFormElement>(null)
  /**
   * 预览是一整页 CampaignPageShell，换模板要重建两千多个节点，实测单次约 325ms。
   * 这是"结果"而不是"操作"，所以降级为低优先级渲染：点击与表单输入先响应，
   * 预览随后补齐，连续点击也会被合并。隐藏字段仍用即时值，提交的永远是用户真正选的模板。
   */
  const previewTemplate = useDeferredValue(template)
  // 预览是纯展示场景，用引用稳定的只读预设，避免每次渲染深拷贝并重建整页预览。
  const config = useMemo(() => getTemplatePresetConfig(previewTemplate), [previewTemplate])
  const previewSelectedTemplate =
    templateOptions.find((option) => option.value === previewTemplate) ?? templateOptions[0]

  // 入场动画只跑一次。切换模板时重播它既没有信息量，又要把整页预览重新淡入，
  // 反而拖慢用户对比模板，所以拆成两个 effect：一次性动效 + 随预览 DOM 重建的滚动动效。
  useEffect(() => {
    const root = formRef.current

    if (!root || prefersReducedMotion()) {
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    let context: gsap.Context | undefined
    const startFrame = window.requestAnimationFrame(() => {
      context = gsap.context(() => {
        const templateList = root.querySelector<HTMLElement>(".new-campaign-template-list")
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

        // 缩略图的视差只依赖模板列表自身的滚动位置，与选中哪个模板无关，
        // 因此留在一次性 effect 里，不必跟着模板反复重建。
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
      }, root)

      ScrollTrigger.refresh()
    })

    return () => {
      window.cancelAnimationFrame(startFrame)
      context?.revert()
    }
  }, [])

  // 只负责预览画布内部的滚动动效。切换模板会换掉整棵预览 DOM，所以这里必须跟着
  // previewTemplate 重建，但作用域收窄到画布，且不再调用全局 ScrollTrigger.refresh()。
  // 依赖的是"预览 DOM 被换掉"这件事本身，effect 体内读不到 previewTemplate；
  // 去掉它会让滚动动效停留在上一个模板已被卸载的节点上。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 见上，previewTemplate 是刻意的重建信号
  useEffect(() => {
    const root = formRef.current
    const previewCanvas = root?.querySelector<HTMLElement>(".new-campaign-preview-canvas")

    if (!previewCanvas || prefersReducedMotion()) {
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    let context: gsap.Context | undefined
    const startFrame = window.requestAnimationFrame(() => {
      context = gsap.context(() => {
        const previewPage = previewCanvas.querySelector<HTMLElement>(".campaign-page")
        const progress = root?.querySelector<HTMLElement>(".new-campaign-browser-progress")

        if (!previewPage) {
          return
        }

        previewCanvas.querySelectorAll<HTMLElement>("[data-campaign-reveal]").forEach((section) => {
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
      }, previewCanvas)
    })

    return () => {
      window.cancelAnimationFrame(startFrame)
      context?.revert()
    }
  }, [previewTemplate])

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
            <p className="text-sm font-medium">{previewSelectedTemplate.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {previewSelectedTemplate.description}
            </p>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {previewSelectedTemplate.code}
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
            <span>{previewSelectedTemplate.code}</span>
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

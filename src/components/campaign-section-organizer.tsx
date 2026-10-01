"use client"

import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, LockKeyholeIcon } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { CampaignBodySection } from "@/types/database"

const sectionDetails: Record<CampaignBodySection, { label: string; description: string }> = {
  video: {
    label: "演示视频",
    description: "独立视频区与视口播放",
  },
  highlights: {
    label: "核心亮点",
    description: "能力摘要与亮点条目",
  },
  slogan: {
    label: "滚动标语",
    description: "独立文案与轮播节奏",
  },
  timeline: {
    label: "发布节奏",
    description: "阶段节点与开放计划",
  },
  signup: {
    label: "预约",
    description: "问卷、邮箱与提交按钮",
  },
}

type DropPosition = "after" | "before"

function OrganizerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function CampaignSectionOrganizer({
  order,
  onOrderChange,
}: {
  order: CampaignBodySection[]
  onOrderChange: (order: CampaignBodySection[]) => void
}) {
  const [draggedSection, setDraggedSection] = useState<CampaignBodySection | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    section: CampaignBodySection
    position: DropPosition
  } | null>(null)
  const dragHandleSection = useRef<CampaignBodySection | null>(null)
  const rowElements = useRef(new Map<CampaignBodySection, HTMLLIElement>())
  const previousRowTops = useRef(new Map<CampaignBodySection, number>())

  useLayoutEffect(() => {
    const nextRowTops = new Map<CampaignBodySection, number>()
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    for (const section of order) {
      const element = rowElements.current.get(section)
      if (!element) {
        continue
      }

      const top = element.getBoundingClientRect().top
      const previousTop = previousRowTops.current.get(section)
      nextRowTops.set(section, top)

      if (!reduceMotion && previousTop !== undefined && Math.abs(previousTop - top) > 1) {
        element.animate(
          [{ transform: `translateY(${previousTop - top}px)` }, { transform: "translateY(0)" }],
          {
            duration: 360,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          }
        )
      }
    }

    previousRowTops.current = nextRowTops
  }, [order])

  function moveSection(section: CampaignBodySection, offset: -1 | 1) {
    const index = order.indexOf(section)
    const destination = index + offset
    if (index < 0 || destination < 0 || destination >= order.length) {
      return
    }

    const nextOrder = [...order]
    const [movedSection] = nextOrder.splice(index, 1)
    nextOrder.splice(destination, 0, movedSection)
    onOrderChange(nextOrder)
  }

  function dropSection(target: CampaignBodySection, position: DropPosition) {
    if (!draggedSection || draggedSection === target) {
      setDraggedSection(null)
      setDropTarget(null)
      return
    }

    const nextOrder = order.filter((section) => section !== draggedSection)
    const targetIndex = nextOrder.indexOf(target)
    const destination = position === "after" ? targetIndex + 1 : targetIndex
    nextOrder.splice(destination, 0, draggedSection)
    onOrderChange(nextOrder)
    setDraggedSection(null)
    setDropTarget(null)
  }

  return (
    <ul className="campaign-section-organizer" aria-label="页面区域排序">
      <li className="campaign-section-organizer-row" data-fixed>
        <span className="campaign-section-drag-handle" aria-hidden="true">
          <LockKeyholeIcon />
        </span>
        <span className="campaign-section-position">00</span>
        <span className="campaign-section-copy">
          <strong>首屏内容</strong>
          <small>固定在正文区域之前</small>
        </span>
        <span className="font-mono text-[8px] text-muted-foreground">FIXED</span>
      </li>

      {order.map((section, index) => {
        const detail = sectionDetails[section]
        const targetPosition = dropTarget?.section === section ? dropTarget.position : undefined

        return (
          <li
            key={section}
            ref={(element) => {
              if (element) {
                rowElements.current.set(section, element)
              } else {
                rowElements.current.delete(section)
              }
            }}
            draggable
            className={cn(
              "campaign-section-organizer-row",
              draggedSection === section && "is-dragging"
            )}
            data-section={section}
            data-drop-position={targetPosition}
            onDragStart={(event) => {
              if (dragHandleSection.current !== section) {
                event.preventDefault()
                return
              }

              const bounds = event.currentTarget.getBoundingClientRect()
              event.dataTransfer.effectAllowed = "move"
              event.dataTransfer.setData("text/plain", section)
              event.dataTransfer.setDragImage(
                event.currentTarget,
                Math.min(28, event.clientX - bounds.left),
                Math.max(0, Math.min(bounds.height, event.clientY - bounds.top))
              )
              setDraggedSection(section)
            }}
            onDragOver={(event) => {
              if (!draggedSection || draggedSection === section) {
                return
              }

              event.preventDefault()
              event.dataTransfer.dropEffect = "move"
              const bounds = event.currentTarget.getBoundingClientRect()
              const position = event.clientY < bounds.top + bounds.height / 2 ? "before" : "after"
              setDropTarget((current) =>
                current?.section === section && current.position === position
                  ? current
                  : { section, position }
              )
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDropTarget((current) => (current?.section === section ? null : current))
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              dropSection(section, targetPosition ?? "before")
            }}
            onDragEnd={() => {
              dragHandleSection.current = null
              setDraggedSection(null)
              setDropTarget(null)
            }}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="campaign-section-drag-handle"
                    aria-label={`拖拽排序：${detail.label}`}
                    onPointerDown={() => {
                      dragHandleSection.current = section
                    }}
                    onPointerUp={() => {
                      dragHandleSection.current = null
                    }}
                    onPointerCancel={() => {
                      dragHandleSection.current = null
                    }}
                  />
                }
              >
                <GripVerticalIcon aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>按住拖拽</TooltipContent>
            </Tooltip>
            <span className="campaign-section-position">{String(index + 1).padStart(2, "0")}</span>
            <span className="campaign-section-copy">
              <strong>{detail.label}</strong>
              <small>{detail.description}</small>
            </span>
            <span className="campaign-section-actions">
              <OrganizerButton
                label={`上移${detail.label}`}
                disabled={index === 0}
                onClick={() => moveSection(section, -1)}
              >
                <ArrowUpIcon aria-hidden="true" />
              </OrganizerButton>
              <OrganizerButton
                label={`下移${detail.label}`}
                disabled={index === order.length - 1}
                onClick={() => moveSection(section, 1)}
              >
                <ArrowDownIcon aria-hidden="true" />
              </OrganizerButton>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

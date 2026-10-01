"use client"

import { ChevronDownIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function CampaignEditorSection({
  id,
  code,
  title,
  description,
  collapsed,
  onCollapsedChange,
  enabled,
  enabledId,
  enabledLabel,
  onEnabledChange,
  meta,
  children,
}: {
  id: string
  code: string
  title: string
  description: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  enabled?: boolean
  enabledId?: string
  enabledLabel?: string
  onEnabledChange?: (enabled: boolean) => void
  meta?: ReactNode
  children: ReactNode
}) {
  const contentId = `${id}-content`

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={(open) => onCollapsedChange(!open)}
      className="campaign-editor-section scroll-mt-16"
      id={id}
      data-enabled={enabled}
    >
      <header className="campaign-editor-section-header">
        <CollapsibleTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="campaign-editor-section-trigger"
              aria-controls={contentId}
            />
          }
        >
          <span className="campaign-editor-section-index">{code}</span>
          <span className="campaign-editor-section-heading">
            <span className="campaign-editor-section-title-row">
              <strong>{title}</strong>
              {meta}
            </span>
            <small>{description}</small>
          </span>
          <ChevronDownIcon data-icon="inline-end" data-open={!collapsed} aria-hidden="true" />
        </CollapsibleTrigger>
        <span className="campaign-editor-section-actions">
          {enabled === undefined ? null : (
            <Switch
              id={enabledId}
              size="sm"
              checked={enabled}
              disabled={!onEnabledChange}
              aria-label={enabledLabel ?? title}
              onCheckedChange={onEnabledChange}
            />
          )}
        </span>
      </header>
      <CollapsibleContent
        id={contentId}
        keepMounted
        className={cn("campaign-editor-section-content", enabled === false && "opacity-60")}
      >
        <div>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

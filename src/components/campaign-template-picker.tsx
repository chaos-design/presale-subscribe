"use client"

import { CheckIcon } from "lucide-react"

import { CampaignTemplateThumbnail } from "@/components/campaign-template-thumbnail"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getTemplatePresetConfig, templateOptions } from "@/lib/campaign-presets"
import { cn } from "@/lib/utils"
import type { CampaignTemplate } from "@/types/database"

interface CampaignTemplatePickerProps {
  value: CampaignTemplate
  onValueChange: (value: CampaignTemplate) => void
  id?: string
  className?: string
}

export function CampaignTemplatePicker({
  value,
  onValueChange,
  id,
  className,
}: CampaignTemplatePickerProps) {
  return (
    <ToggleGroup
      id={id}
      value={[value]}
      onValueChange={(values) => {
        const nextValue = values[0] as CampaignTemplate | undefined
        if (nextValue) {
          onValueChange(nextValue)
        }
      }}
      variant="outline"
      spacing={2}
      className={cn("campaign-template-picker grid w-full grid-cols-2", className)}
      aria-label="选择全页模板"
    >
      {templateOptions.map((option) => {
        const selected = option.value === value

        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="campaign-template-picker-item new-campaign-template-option group/template"
            aria-label={`${option.label}：${option.description}`}
          >
            <CampaignTemplateThumbnail
              config={getTemplatePresetConfig(option.value)}
              label={option.label}
              className="campaign-template-picker-swatch new-campaign-template-swatch"
              decorative
            />
            <span className="campaign-template-picker-copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
            <span
              className="campaign-template-picker-check"
              data-selected={selected ? true : undefined}
              aria-hidden="true"
            >
              <CheckIcon />
            </span>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}

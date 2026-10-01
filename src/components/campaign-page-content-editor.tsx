"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type {
  CampaignPageContent,
  CampaignPageHighlight,
  CampaignPageMilestone,
} from "@/types/database"

interface CampaignPageContentEditorProps {
  value: CampaignPageContent
  onChange: (value: CampaignPageContent) => void
}

type PageItemKey = keyof CampaignPageHighlight

const maxPageItems = 6

function CollectionAddButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        <PlusIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ItemDeleteButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      <Trash2Icon aria-hidden="true" />
    </Button>
  )
}

export function CampaignHighlightsEditor({ value, onChange }: CampaignPageContentEditorProps) {
  function updateField<Key extends keyof CampaignPageContent>(
    key: Key,
    nextValue: CampaignPageContent[Key]
  ) {
    onChange({ ...value, [key]: nextValue })
  }

  function updateHighlight(index: number, key: PageItemKey, nextValue: string) {
    updateField(
      "highlights",
      value.highlights.map((highlight, currentIndex) =>
        currentIndex === index ? { ...highlight, [key]: nextValue } : highlight
      )
    )
  }

  function addHighlight() {
    if (value.highlights.length >= maxPageItems) {
      return
    }

    updateField("highlights", [
      ...value.highlights,
      {
        label: `POINT / ${String(value.highlights.length + 1).padStart(2, "0")}`,
        title: "新的核心亮点",
        description: "补充这一项最值得访客关注的具体变化。",
      },
    ])
  }

  function removeHighlight(index: number) {
    if (value.highlights.length <= 1) {
      return
    }

    updateField(
      "highlights",
      value.highlights.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  return (
    <FieldGroup>
      <Field data-preview-source="section-eyebrow">
        <FieldLabel htmlFor="section-eyebrow">内容段标识</FieldLabel>
        <Input
          id="section-eyebrow"
          value={value.sectionEyebrow}
          maxLength={48}
          onChange={(event) => updateField("sectionEyebrow", event.target.value)}
        />
      </Field>
      <div className="campaign-content-collection-heading">
        <FieldDescription>
          当前 {value.highlights.length} 项，页面会按数量自动调整排布，最多 {maxPageItems} 项。
        </FieldDescription>
        <CollectionAddButton
          label="新增亮点"
          disabled={value.highlights.length >= maxPageItems}
          onClick={addHighlight}
        />
      </div>
      {value.highlights.map((highlight, index) => (
        <FieldGroup
          key={`highlight-${index}`}
          className="border-t pt-5"
          data-preview-source={`highlight-${index}`}
        >
          <div className="campaign-content-item-heading">
            <p className="font-mono text-[9px] uppercase text-muted-foreground">
              Highlight / {String(index + 1).padStart(2, "0")}
            </p>
            <ItemDeleteButton
              label={`删除第 ${index + 1} 个核心亮点`}
              disabled={value.highlights.length <= 1}
              onClick={() => removeHighlight(index)}
            />
          </div>
          <Field>
            <FieldLabel htmlFor={`highlight-label-${index}`}>标识</FieldLabel>
            <Input
              id={`highlight-label-${index}`}
              value={highlight.label}
              maxLength={40}
              onChange={(event) => updateHighlight(index, "label", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`highlight-title-${index}`}>标题</FieldLabel>
            <Input
              id={`highlight-title-${index}`}
              value={highlight.title}
              maxLength={100}
              onChange={(event) => updateHighlight(index, "title", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`highlight-description-${index}`}>说明</FieldLabel>
            <Textarea
              id={`highlight-description-${index}`}
              value={highlight.description}
              rows={3}
              maxLength={260}
              onChange={(event) => updateHighlight(index, "description", event.target.value)}
            />
          </Field>
        </FieldGroup>
      ))}
    </FieldGroup>
  )
}

export function CampaignTimelineEditor({ value, onChange }: CampaignPageContentEditorProps) {
  function updateField<Key extends keyof CampaignPageContent>(
    key: Key,
    nextValue: CampaignPageContent[Key]
  ) {
    onChange({ ...value, [key]: nextValue })
  }

  function updateMilestone(index: number, key: PageItemKey, nextValue: string) {
    updateField(
      "milestones",
      value.milestones.map((milestone, currentIndex) =>
        currentIndex === index ? { ...milestone, [key]: nextValue } : milestone
      ) as CampaignPageMilestone[]
    )
  }

  function addMilestone() {
    if (value.milestones.length >= maxPageItems) {
      return
    }

    updateField("milestones", [
      ...value.milestones,
      {
        label: `STAGE / ${String(value.milestones.length + 1).padStart(2, "0")}`,
        title: "新的发布节点",
        description: "说明这一阶段的目标、范围与预计开放动作。",
      },
    ])
  }

  function removeMilestone(index: number) {
    if (value.milestones.length <= 1) {
      return
    }

    updateField(
      "milestones",
      value.milestones.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  return (
    <FieldGroup>
      <div className="campaign-content-collection-heading">
        <FieldDescription>
          当前 {value.milestones.length} 个节点，页面会按数量自动调整排布，最多 {maxPageItems} 个。
        </FieldDescription>
        <CollectionAddButton
          label="新增节点"
          disabled={value.milestones.length >= maxPageItems}
          onClick={addMilestone}
        />
      </div>
      <Field data-preview-source="timeline-title">
        <FieldLabel htmlFor="timeline-title">段落标题</FieldLabel>
        <Textarea
          id="timeline-title"
          value={value.timelineTitle}
          rows={2}
          maxLength={120}
          onChange={(event) => updateField("timelineTitle", event.target.value)}
        />
      </Field>
      <Field data-preview-source="timeline-description">
        <FieldLabel htmlFor="timeline-description">段落说明</FieldLabel>
        <Textarea
          id="timeline-description"
          value={value.timelineDescription}
          rows={4}
          maxLength={500}
          onChange={(event) => updateField("timelineDescription", event.target.value)}
        />
      </Field>
      {value.milestones.map((milestone, index) => (
        <FieldGroup
          key={`milestone-${index}`}
          className="border-t pt-5"
          data-preview-source={`milestone-${index}`}
        >
          <div className="campaign-content-item-heading">
            <p className="font-mono text-[9px] uppercase text-muted-foreground">
              Milestone / {String(index + 1).padStart(2, "0")}
            </p>
            <ItemDeleteButton
              label={`删除第 ${index + 1} 个发布节点`}
              disabled={value.milestones.length <= 1}
              onClick={() => removeMilestone(index)}
            />
          </div>
          <Field>
            <FieldLabel htmlFor={`milestone-label-${index}`}>节点标识</FieldLabel>
            <Input
              id={`milestone-label-${index}`}
              value={milestone.label}
              maxLength={40}
              onChange={(event) => updateMilestone(index, "label", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`milestone-title-${index}`}>节点标题</FieldLabel>
            <Input
              id={`milestone-title-${index}`}
              value={milestone.title}
              maxLength={100}
              onChange={(event) => updateMilestone(index, "title", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`milestone-description-${index}`}>节点说明</FieldLabel>
            <Textarea
              id={`milestone-description-${index}`}
              value={milestone.description}
              rows={3}
              maxLength={260}
              onChange={(event) => updateMilestone(index, "description", event.target.value)}
            />
          </Field>
        </FieldGroup>
      ))}
    </FieldGroup>
  )
}

export function CampaignClosingEditor({ value, onChange }: CampaignPageContentEditorProps) {
  return (
    <FieldGroup>
      <Field data-preview-source="closing-title">
        <FieldLabel htmlFor="closing-title">预约标题</FieldLabel>
        <Textarea
          id="closing-title"
          value={value.closingTitle}
          rows={2}
          maxLength={120}
          onChange={(event) => onChange({ ...value, closingTitle: event.target.value })}
        />
      </Field>
      <Field data-preview-source="closing-description">
        <FieldLabel htmlFor="closing-description">预约说明</FieldLabel>
        <Textarea
          id="closing-description"
          value={value.closingDescription}
          rows={4}
          maxLength={400}
          onChange={(event) => onChange({ ...value, closingDescription: event.target.value })}
        />
      </Field>
    </FieldGroup>
  )
}

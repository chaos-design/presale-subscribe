"use client"

import { ImageIcon, MoveIcon, RotateCcwIcon, Trash2Icon, UploadIcon } from "lucide-react"
import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useRef,
} from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CampaignImagePosition } from "@/types/database"

const centeredImagePosition: CampaignImagePosition = { x: 50, y: 50 }

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function CampaignCoverImageEditor({
  value,
  position,
  errors,
  isUploading,
  inputRef,
  onUpload,
  onRemove,
  onChange,
  onPositionChange,
}: {
  value: string
  position: CampaignImagePosition
  errors?: Array<{ message?: string }>
  isUploading: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  onChange: (value: string) => void
  onPositionChange: (position: CampaignImagePosition) => void
}) {
  const dragState = useRef<{
    pointerId: number
    startX: number
    startY: number
    position: CampaignImagePosition
  } | null>(null)
  const imageStyle = {
    objectPosition: `${position.x}% ${position.y}%`,
  } as CSSProperties
  const markerStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
  } as CSSProperties

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      position,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragState.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    onPositionChange({
      x: clampPosition(drag.position.x - ((event.clientX - drag.startX) / bounds.width) * 100),
      y: clampPosition(drag.position.y - ((event.clientY - drag.startY) / bounds.height) * 100),
    })
  }

  function stopDragging(event: PointerEvent<HTMLButtonElement>) {
    if (dragState.current?.pointerId !== event.pointerId) {
      return
    }

    dragState.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handlePositionKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 10 : 2
    const nextPosition = { ...position }

    if (event.key === "ArrowLeft") {
      nextPosition.x = clampPosition(position.x - step)
    } else if (event.key === "ArrowRight") {
      nextPosition.x = clampPosition(position.x + step)
    } else if (event.key === "ArrowUp") {
      nextPosition.y = clampPosition(position.y - step)
    } else if (event.key === "ArrowDown") {
      nextPosition.y = clampPosition(position.y + step)
    } else {
      return
    }

    event.preventDefault()
    onPositionChange(nextPosition)
  }

  return (
    <Field data-invalid={Boolean(errors?.length)} data-preview-source="cover-image">
      <FieldLabel htmlFor="cover-image">背景图片</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-label="上传背景图片"
        onChange={onUpload}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <UploadIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {isUploading ? "上传中" : "上传图片"}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" aria-hidden="true" />
            移除图片
          </Button>
        ) : null}
      </div>
      {value ? (
        <div className="campaign-cover-position-shell">
          <button
            type="button"
            className="campaign-cover-position-editor"
            aria-label={`调整封面图片位置，当前横向 ${Math.round(position.x)}%，纵向 ${Math.round(position.y)}%`}
            onKeyDown={handlePositionKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            {/* biome-ignore lint/performance/noImgElement: supports object URLs and Supabase public URLs */}
            <img
              src={value}
              alt="当前背景图片预览"
              className="size-full object-cover"
              style={imageStyle}
              draggable={false}
            />
            <span className="campaign-cover-position-shade" aria-hidden="true" />
            <span className="campaign-cover-position-marker" style={markerStyle} aria-hidden="true">
              <MoveIcon />
            </span>
            <span className="campaign-cover-position-value" aria-hidden="true">
              X {Math.round(position.x)} / Y {Math.round(position.y)}
            </span>
          </button>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="campaign-cover-position-reset"
                  aria-label="图片位置居中"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => onPositionChange(centeredImagePosition)}
                />
              }
            >
              <RotateCcwIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>图片位置居中</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
      <FieldDescription>
        建议尺寸 1600 × 2000 px（4:5），至少 1200 × 1500 px；支持 JPG、PNG、WebP、AVIF，最大 8 MB。
      </FieldDescription>
      <FieldLabel htmlFor="cover-image" className="text-xs text-muted-foreground">
        或填写图片 URL
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="cover-image"
          name="coverImage"
          type="url"
          placeholder="https://example.com/cover.jpg"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(errors?.length)}
        />
        <InputGroupAddon align="inline-start">
          <ImageIcon aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
      <FieldError errors={errors} />
    </Field>
  )
}

"use client"

import { FilmIcon, Trash2Icon, UploadIcon } from "lucide-react"
import type { ChangeEvent, RefObject } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import type { CampaignPreviewVideo } from "@/types/database"

export function CampaignPreviewVideoEditor({
  value,
  errors,
  isUploading,
  inputRef,
  onUpload,
  onRemove,
  onChange,
}: {
  value: CampaignPreviewVideo
  errors?: Array<{ message?: string }>
  isUploading: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  onChange: (value: CampaignPreviewVideo) => void
}) {
  function updateVideo<Key extends keyof CampaignPreviewVideo>(
    key: Key,
    nextValue: CampaignPreviewVideo[Key]
  ) {
    const nextVideo = { ...value, [key]: nextValue }
    if (key === "autoplay" && nextValue === true) {
      nextVideo.muted = true
    }
    if (key === "muted" && nextValue === false) {
      nextVideo.autoplay = false
    }
    if (key === "url" && nextValue !== value.url) {
      nextVideo.posterUrl = ""
    }
    onChange(nextVideo)
  }

  return (
    <Field data-invalid={Boolean(errors?.length)} data-preview-source="preview-video">
      <FieldLabel htmlFor="preview-video">预览视频</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="sr-only"
        aria-label="上传预览视频"
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
          {isUploading ? "上传中" : "上传视频"}
        </Button>
        {value.url ? (
          <Button type="button" variant="ghost" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" aria-hidden="true" />
            移除视频
          </Button>
        ) : null}
      </div>
      {value.url ? (
        <div className="campaign-video-editor-preview">
          <video
            src={value.url}
            poster={value.posterUrl || undefined}
            controls
            playsInline
            preload="metadata"
            muted={value.muted}
            loop={value.loop}
          >
            <track kind="captions" />
          </video>
        </div>
      ) : null}
      <FieldDescription>
        视频会显示为首屏后的独立区域；支持 MP4、WebM、OGG、MOV，最大 100 MB。
      </FieldDescription>
      <FieldLabel htmlFor="preview-video" className="text-xs text-muted-foreground">
        或填写视频 URL
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="preview-video"
          type="url"
          placeholder="https://example.com/product-preview.mp4"
          value={value.url}
          onChange={(event) => updateVideo("url", event.target.value)}
          aria-invalid={Boolean(errors?.length)}
        />
        <InputGroupAddon align="inline-start">
          <FilmIcon aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
      <fieldset className="campaign-video-editor-options">
        <legend className="sr-only">视频播放设置</legend>
        <label htmlFor="preview-video-autoplay">
          <span>
            <strong>自动播放</strong>
            <small>进入可视区域后静音播放</small>
          </span>
          <Switch
            id="preview-video-autoplay"
            checked={value.autoplay}
            onCheckedChange={(checked) => updateVideo("autoplay", checked)}
            aria-label="自动播放预览视频"
          />
        </label>
        <label htmlFor="preview-video-muted">
          <span>
            <strong>静音</strong>
            <small>默认静音，访客可手动开启声音</small>
          </span>
          <Switch
            id="preview-video-muted"
            checked={value.muted}
            onCheckedChange={(checked) => updateVideo("muted", checked)}
            aria-label="预览视频静音"
          />
        </label>
        <label htmlFor="preview-video-loop">
          <span>
            <strong>循环播放</strong>
            <small>结束后重新开始</small>
          </span>
          <Switch
            id="preview-video-loop"
            checked={value.loop}
            onCheckedChange={(checked) => updateVideo("loop", checked)}
            aria-label="循环播放预览视频"
          />
        </label>
      </fieldset>
      <FieldError errors={errors} />
    </Field>
  )
}

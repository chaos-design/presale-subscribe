import { ArrowDownIcon, RadarIcon, SparklesIcon } from "lucide-react"
import { type CSSProperties, Fragment, type ReactNode } from "react"

import { BrandMark } from "@/components/brand-mark"
import { CampaignClosingArtwork } from "@/components/campaign-closing-artwork"
import { CampaignCountdown } from "@/components/campaign-countdown"
import { CampaignViewportVideo } from "@/components/campaign-viewport-video"
import { GithubMark } from "@/components/github-mark"
import { getThemeForeground } from "@/lib/campaign-presets"
import {
  type CampaignClosingLayout,
  type CampaignHeroMedia,
  getCampaignTemplateScheme,
} from "@/lib/campaign-template-schemes"
import { productConfig } from "@/lib/product-config"
import { cn } from "@/lib/utils"
import type { CampaignBodySection, CampaignConfig, CampaignTemplate } from "@/types/database"

const marqueeRepeats = [0, 1, 2, 3] as const

interface CampaignPageShellProps {
  config: CampaignConfig
  activeEditorTarget?: string
  slug: string
  renderMode: "preview" | "public"
  viewport?: "desktop" | "mobile"
  interactive?: boolean
  subscription: ReactNode
  className?: string
}

interface CampaignSectionProps {
  config: CampaignConfig
  activeEditorTarget?: string
  sectionNumber: string
}

function CampaignPageBrand({ label, preview }: { label?: string; preview: boolean }) {
  if (!preview && !label) {
    return <BrandMark className="campaign-page-brand" />
  }

  return (
    <span className="campaign-page-brand" role="img" aria-label={label ?? productConfig.name}>
      <i>
        <RadarIcon aria-hidden="true" />
      </i>
      <b>{label ?? productConfig.wordmark}</b>
    </span>
  )
}

function CampaignGithubLink({ preview }: { preview: boolean }) {
  const label = `在 GitHub 上查看 ${productConfig.name}`

  if (preview) {
    return (
      <span className="campaign-page-footer-github" role="img" aria-label={label}>
        <GithubMark />
      </span>
    )
  }

  return (
    <a
      className="campaign-page-footer-github"
      href={productConfig.productCredit.githubUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
    >
      <GithubMark />
    </a>
  )
}

function editorTarget(target: string, activeEditorTarget?: string) {
  return {
    "data-editor-target": target,
    "data-editor-active": activeEditorTarget === target ? true : undefined,
  }
}

function getHeroStatusItems(template: CampaignTemplate, slug: string) {
  if (template === "nocturne") {
    return ["PREMIERE / INVITATION OPEN", "SEAT LIST / NOW RESERVING"]
  }

  return ["STATUS / OPEN", `PUBLIC LINK / ${slug}`]
}

function CampaignImage({
  config,
  activeEditorTarget,
}: {
  config: CampaignConfig
  activeEditorTarget?: string
}) {
  return (
    <div className="campaign-page-image" {...editorTarget("cover-image", activeEditorTarget)}>
      {config.coverImage ? (
        // biome-ignore lint/performance/noImgElement: supports generated and owner-configured images
        <img
          src={config.coverImage}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            objectPosition: `${config.coverImagePosition.x}% ${config.coverImagePosition.y}%`,
          }}
        />
      ) : null}
      <div className="campaign-page-image-overlay" />
      <div className="campaign-page-image-meta">
        <span>VISUAL / 01</span>
        <span>LIVE ASSET</span>
      </div>
    </div>
  )
}

function CampaignHero({
  config,
  activeEditorTarget,
  slug,
  heroMedia,
}: {
  config: CampaignConfig
  activeEditorTarget?: string
  slug: string
  heroMedia: CampaignHeroMedia
}) {
  const heroStatusItems = getHeroStatusItems(config.template, slug)
  const copy = (
    <div className="campaign-page-hero-copy">
      <div className="campaign-page-kicker" {...editorTarget("eyebrow", activeEditorTarget)}>
        <i />
        <span>{config.eyebrow}</span>
      </div>
      <h1
        className="campaign-public-title campaign-preview-title"
        {...editorTarget("title", activeEditorTarget)}
      >
        {config.title}
      </h1>
      <p className="campaign-preview-copy" {...editorTarget("description", activeEditorTarget)}>
        {config.description}
      </p>
      <div className="campaign-page-hero-status">
        {heroStatusItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )
  const visual = (
    <div className="campaign-page-hero-visual" {...editorTarget("page-visual", activeEditorTarget)}>
      <CampaignImage config={config} activeEditorTarget={activeEditorTarget} />
      <div className="campaign-page-art" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  )

  return (
    <section className="campaign-page-hero">
      <div className="campaign-page-hero-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {heroMedia === "before-copy" ? visual : copy}
      {heroMedia === "before-copy" ? copy : visual}
      <div className="campaign-page-scroll-cue" aria-hidden="true">
        <ArrowDownIcon />
        <span>SCROLL TO EXPLORE</span>
      </div>
    </section>
  )
}

function CampaignVideo({
  config,
  activeEditorTarget,
  sectionNumber,
}: {
  config: CampaignConfig
  activeEditorTarget?: string
  sectionNumber: string
}) {
  return (
    <section className="campaign-page-video-section" data-campaign-reveal>
      <div className="campaign-page-section-index">
        <span>{sectionNumber}</span>
        <i />
        <small>PRODUCT / PREVIEW</small>
      </div>
      <CampaignViewportVideo value={config.previewVideo} activeEditorTarget={activeEditorTarget} />
      <div className="campaign-page-video-meta" aria-hidden="true">
        <span>PLAYBACK / INLINE</span>
        <span>{config.previewVideo.autoplay ? "VIEWPORT AUTO" : "MANUAL START"}</span>
      </div>
    </section>
  )
}

function CampaignHighlights({ config, activeEditorTarget, sectionNumber }: CampaignSectionProps) {
  return (
    <section className="campaign-page-intro" data-campaign-reveal>
      <div className="campaign-page-section-index">
        <span>{sectionNumber}</span>
        <i />
        <small {...editorTarget("section-eyebrow", activeEditorTarget)}>
          {config.pageContent.sectionEyebrow}
        </small>
      </div>
      <div className="campaign-page-intro-copy">
        <p {...editorTarget("section-eyebrow", activeEditorTarget)}>
          {config.pageContent.sectionEyebrow}
        </p>
        <h2 {...editorTarget("feature-title", activeEditorTarget)}>{config.featureTitle}</h2>
        <div>
          <p {...editorTarget("feature-description", activeEditorTarget)}>
            {config.featureDescription}
          </p>
          <span>
            <SparklesIcon aria-hidden="true" />
            CURATED RELEASE / {String(config.pageContent.highlights.length).padStart(2, "0")}
          </span>
        </div>
      </div>
      <div
        className="campaign-page-highlights"
        style={{ "--campaign-item-count": config.pageContent.highlights.length } as CSSProperties}
      >
        {config.pageContent.highlights.map((highlight, index) => (
          <article
            key={`${highlight.label}-${index}`}
            {...editorTarget(`highlight-${index}`, activeEditorTarget)}
          >
            <div>
              <span>{highlight.label}</span>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
            </div>
            <h3>{highlight.title}</h3>
            <p>{highlight.description}</p>
            <i aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  )
}

function CampaignSlogan({
  config,
  activeEditorTarget,
}: {
  config: CampaignConfig
  activeEditorTarget?: string
}) {
  const marqueeStyle = {
    "--campaign-marquee-duration": `${config.marquee.speed}s`,
  } as CSSProperties

  return (
    <div
      className="campaign-page-marquee"
      data-infinite={config.marquee.infinite}
      aria-hidden="true"
      style={marqueeStyle}
      {...editorTarget("marquee-content", activeEditorTarget)}
    >
      <div className="campaign-page-marquee-track">
        {config.marquee.infinite ? (
          [0, 1].map((group) => (
            <span
              key={group}
              className="campaign-page-marquee-group"
              aria-hidden={group === 1 ? true : undefined}
            >
              {marqueeRepeats.map((repeat) => (
                <span key={repeat}>
                  <b>{config.marquee.content}</b>
                  <i />
                </span>
              ))}
            </span>
          ))
        ) : (
          <span className="campaign-page-marquee-static">{config.marquee.content}</span>
        )}
      </div>
    </div>
  )
}

function CampaignTimeline({ config, activeEditorTarget, sectionNumber }: CampaignSectionProps) {
  return (
    <section className="campaign-page-timeline" data-campaign-reveal>
      <div className="campaign-page-section-index">
        <span>{sectionNumber}</span>
        <i />
        <small>RELEASE PATH</small>
      </div>
      <header>
        <h2 {...editorTarget("timeline-title", activeEditorTarget)}>
          {config.pageContent.timelineTitle}
        </h2>
        <p {...editorTarget("timeline-description", activeEditorTarget)}>
          {config.pageContent.timelineDescription}
        </p>
      </header>
      <ol
        style={{ "--campaign-item-count": config.pageContent.milestones.length } as CSSProperties}
      >
        {config.pageContent.milestones.map((milestone, index) => (
          <li
            key={`${milestone.label}-${index}`}
            {...editorTarget(`milestone-${index}`, activeEditorTarget)}
          >
            <span>{milestone.label}</span>
            <div>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <i />
            </div>
            <h3>{milestone.title}</h3>
            <p>{milestone.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function CampaignClosing({
  config,
  activeEditorTarget,
  sectionNumber,
  subscription,
  layout,
}: CampaignSectionProps & {
  subscription: ReactNode
  layout: CampaignClosingLayout
}) {
  const copy = (
    <header className="campaign-page-closing-copy">
      <span>{config.eyebrow}</span>
      <h2 {...editorTarget("closing-title", activeEditorTarget)}>
        {config.pageContent.closingTitle}
      </h2>
      <p {...editorTarget("closing-description", activeEditorTarget)}>
        {config.pageContent.closingDescription}
      </p>
      <CampaignClosingArtwork template={config.template} />
    </header>
  )
  const form = <div className="campaign-page-subscription">{subscription}</div>

  return (
    <section className="campaign-page-closing" data-campaign-reveal>
      <div className="campaign-page-section-index">
        <span>{sectionNumber}</span>
        <i />
        <small>RESERVE / ACCESS</small>
      </div>
      <div className="campaign-page-closing-grid">
        {layout === "reverse" ? form : copy}
        {layout === "reverse" ? copy : form}
      </div>
    </section>
  )
}

function getSectionNumber(
  section: Exclude<CampaignBodySection, "slogan">,
  sectionOrder: CampaignBodySection[],
  visibility: CampaignConfig["sectionVisibility"],
  hasVideo: boolean
) {
  const numberedSections = sectionOrder.filter(
    (item): item is Exclude<CampaignBodySection, "slogan"> =>
      item !== "slogan" && visibility[item] && (item !== "video" || hasVideo)
  )

  return String(numberedSections.indexOf(section) + 1).padStart(2, "0")
}

export function CampaignPageShell({
  config,
  activeEditorTarget,
  slug,
  renderMode,
  viewport = "desktop",
  interactive = false,
  subscription,
  className,
}: CampaignPageShellProps) {
  const scheme = getCampaignTemplateScheme(config.template)
  const preview = renderMode === "preview"
  const { sectionVisibility } = config
  const sectionOrder = config.sectionOrder
  const hasVisibleVideo = sectionVisibility.video && Boolean(config.previewVideo.url)
  const hasCountdown = config.countdown.enabled && Boolean(config.countdown.targetAt)
  const motionIntensity =
    config.motionSettings.intensity === "subtle"
      ? 0.6
      : config.motionSettings.intensity === "bold"
        ? 1.4
        : 1
  const style = {
    "--campaign-color": config.themeColor,
    "--campaign-foreground": getThemeForeground(config.themeColor),
    "--campaign-page-bg": scheme.colors.background,
    "--campaign-page-surface": scheme.colors.surface,
    "--campaign-page-text": scheme.colors.text,
    "--campaign-page-muted": scheme.colors.muted,
    "--campaign-page-grid": scheme.colors.grid,
    "--campaign-motion-duration-scale": 1 / config.motionSettings.speed,
    "--campaign-motion-intensity": motionIntensity,
  } as CSSProperties

  function renderBodySection(section: CampaignBodySection) {
    if (!sectionVisibility[section]) {
      return null
    }

    switch (section) {
      case "highlights":
        return (
          <CampaignHighlights
            config={config}
            activeEditorTarget={activeEditorTarget}
            sectionNumber={getSectionNumber(
              "highlights",
              sectionOrder,
              sectionVisibility,
              hasVisibleVideo
            )}
          />
        )
      case "video":
        return hasVisibleVideo ? (
          <CampaignVideo
            config={config}
            activeEditorTarget={activeEditorTarget}
            sectionNumber={getSectionNumber(
              "video",
              sectionOrder,
              sectionVisibility,
              hasVisibleVideo
            )}
          />
        ) : null
      case "slogan":
        return <CampaignSlogan config={config} activeEditorTarget={activeEditorTarget} />
      case "timeline":
        return (
          <CampaignTimeline
            config={config}
            activeEditorTarget={activeEditorTarget}
            sectionNumber={getSectionNumber(
              "timeline",
              sectionOrder,
              sectionVisibility,
              hasVisibleVideo
            )}
          />
        )
      case "signup":
        return (
          <CampaignClosing
            config={config}
            activeEditorTarget={activeEditorTarget}
            sectionNumber={getSectionNumber(
              "signup",
              sectionOrder,
              sectionVisibility,
              hasVisibleVideo
            )}
            subscription={subscription}
            layout={scheme.layout.closing}
          />
        )
    }
  }

  return (
    <main
      className={cn(
        "campaign-page campaign-motion",
        interactive ? "campaign-page-interactive" : null,
        className
      )}
      data-template={config.template}
      data-composition={scheme.composition}
      data-tone={scheme.tone}
      data-font={scheme.font}
      data-hero-layout={scheme.heroLayout}
      data-hero-media={scheme.layout.heroMedia}
      data-highlights-layout={scheme.layout.highlights}
      data-timeline-layout={scheme.layout.timeline}
      data-closing-layout={scheme.layout.closing}
      data-subscription-layout={scheme.layout.subscription}
      data-render-mode={renderMode}
      data-viewport={viewport}
      data-motion={config.motion}
      data-motion-ambient={config.motionSettings.ambient}
      data-motion-entrance={config.motionSettings.entrance}
      data-motion-intensity={config.motionSettings.intensity}
      data-motion-parallax={config.motionSettings.parallax}
      data-motion-scroll-reveal={config.motionSettings.scrollReveal}
      data-motion-speed={config.motionSettings.speed}
      data-has-video={hasVisibleVideo}
      style={style}
    >
      <div className="campaign-motion-layer" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="campaign-page-grid" aria-hidden="true" />

      {config.header.enabled ? (
        <header className="campaign-page-header">
          <span {...editorTarget("header-brand", activeEditorTarget)}>
            <CampaignPageBrand label={config.header.brandLabel} preview={preview} />
          </span>
          <div className="campaign-page-header-meta">
            {config.header.showSlogan ? (
              <span
                className="campaign-page-header-slogan"
                {...editorTarget("header-slogan", activeEditorTarget)}
              >
                {config.slogan}
              </span>
            ) : null}
            {config.header.metaLabel ? (
              <span {...editorTarget("header-meta", activeEditorTarget)}>
                {config.header.metaLabel}
              </span>
            ) : null}
          </div>
        </header>
      ) : null}

      {sectionVisibility.hero ? (
        <CampaignHero
          config={config}
          activeEditorTarget={activeEditorTarget}
          slug={slug}
          heroMedia={scheme.layout.heroMedia}
        />
      ) : null}

      {hasCountdown ? (
        <CampaignCountdown countdown={config.countdown} activeEditorTarget={activeEditorTarget} />
      ) : null}

      {sectionOrder.map((section) => (
        <Fragment key={section}>{renderBodySection(section)}</Fragment>
      ))}

      <footer className="campaign-page-footer">
        <div className="campaign-page-footer-info">
          <CampaignPageBrand preview={preview} />
          <div className="campaign-page-footer-copy">
            <span className="campaign-page-footer-slogan">{productConfig.productCredit.label}</span>
            <span className="campaign-page-footer-description">
              {productConfig.productCredit.description}
            </span>
          </div>
        </div>
        <div className="campaign-page-footer-actions">
          <span className="campaign-page-footer-year">{productConfig.productCredit.year}</span>
          <CampaignGithubLink preview={preview} />
        </div>
      </footer>
    </main>
  )
}

import { ArrowRightIcon, MailIcon } from "lucide-react"
import type { CSSProperties } from "react"

import { CampaignPageShell } from "@/components/campaign-page-shell"
import { SubscribeFormPreview } from "@/components/subscribe-form"
import { getThemeForeground } from "@/lib/campaign-presets"
import { getCampaignTemplateScheme } from "@/lib/campaign-template-schemes"
import { cn } from "@/lib/utils"
import type { CampaignConfig } from "@/types/database"

interface CampaignPreviewProps {
  config: CampaignConfig
  activeEditorTarget?: string
  className?: string
  interactive?: boolean
  showQuestionnaire?: boolean
  thumbnail?: boolean
  viewport?: "desktop" | "mobile"
  slug?: string
}

function CampaignThumbnailSubscription({ config }: { config: CampaignConfig }) {
  const scheme = getCampaignTemplateScheme(config.template)
  const questionnaire = config.questionnaire
  const style = {
    "--subscribe-color": config.themeColor,
    "--subscribe-foreground": getThemeForeground(config.themeColor),
  } as CSSProperties

  return (
    <div className="campaign-page-preview-subscription">
      <div
        className="campaign-subscribe campaign-template-preview-subscribe"
        data-template={config.template}
        data-tone={scheme.tone}
        data-questionnaire={questionnaire.enabled && questionnaire.questions.length > 0}
        data-subscription-layout={scheme.layout.subscription}
        style={style}
      >
        <div className="campaign-subscribe-fields">
          {questionnaire.enabled && questionnaire.questions.length > 0 ? (
            <section className="campaign-questionnaire">
              <header className="campaign-questionnaire-header">
                <span className="campaign-questionnaire-count font-mono">
                  {questionnaire.questions.length} 个问题
                </span>
                <h2 className="campaign-questionnaire-title">{questionnaire.title}</h2>
                {questionnaire.description ? <p>{questionnaire.description}</p> : null}
              </header>
              <div className="campaign-question-list">
                {questionnaire.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="campaign-question"
                    data-question-type={question.type}
                  >
                    <div className="campaign-question-layout">
                      <div className="campaign-question-body">
                        <div className="campaign-question-heading">
                          <span className="campaign-question-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <strong className="campaign-question-label">{question.label}</strong>
                        </div>
                        {question.type === "short_text" ? (
                          <div className="campaign-question-answer">
                            {question.placeholder || "填写你的回答"}
                          </div>
                        ) : (
                          <div className="campaign-question-options">
                            {question.options.map((option) => (
                              <span key={option} className="campaign-question-option">
                                <i
                                  className="campaign-question-control"
                                  data-control-type={
                                    question.type === "multiple_choice" ? "checkbox" : "radio"
                                  }
                                />
                                <span>{option}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <div className="campaign-subscribe-email-panel">
            <div className="campaign-subscribe-email-question">
              <div className="campaign-subscribe-email-body">
                <strong className="campaign-subscribe-email-label">
                  {config.emailLabel}
                  <span aria-hidden="true"> *</span>
                </strong>
                <div className="campaign-subscribe-email-row">
                  <span
                    className={cn(
                      "campaign-subscribe-field campaign-template-preview-email-field",
                      scheme.tone === "dark"
                        ? "bg-white/10 text-white"
                        : "bg-black/[0.06] text-neutral-950"
                    )}
                  >
                    <MailIcon aria-hidden="true" />
                    <span>name@email.com</span>
                  </span>
                  <span
                    className="campaign-subscribe-button campaign-template-preview-submit"
                    style={{
                      backgroundColor: config.themeColor,
                      color: getThemeForeground(config.themeColor),
                    }}
                  >
                    {config.buttonLabel}
                    <ArrowRightIcon aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CampaignPreview({
  config,
  activeEditorTarget,
  className,
  interactive = false,
  showQuestionnaire = false,
  thumbnail = false,
  viewport = "desktop",
  slug = "preview",
}: CampaignPreviewProps) {
  const previewConfig =
    showQuestionnaire || thumbnail
      ? config
      : {
          ...config,
          questionnaire: {
            ...config.questionnaire,
            enabled: false,
          },
        }
  const scheme = getCampaignTemplateScheme(previewConfig.template)

  return (
    <CampaignPageShell
      config={previewConfig}
      activeEditorTarget={activeEditorTarget}
      slug={slug}
      renderMode="preview"
      viewport={viewport}
      interactive={interactive}
      className={className}
      subscription={
        thumbnail ? (
          <CampaignThumbnailSubscription config={previewConfig} />
        ) : (
          <div className="campaign-page-preview-subscription">
            <SubscribeFormPreview
              activeEditorTarget={activeEditorTarget}
              slug={`${slug}-${viewport}`}
              emailLabel={previewConfig.emailLabel}
              buttonLabel={previewConfig.buttonLabel}
              themeColor={previewConfig.themeColor}
              template={previewConfig.template}
              subscriptionLayout={scheme.layout.subscription}
              questionnaire={previewConfig.questionnaire}
              variant={scheme.tone}
            />
          </div>
        )
      }
    />
  )
}

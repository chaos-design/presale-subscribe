"use client"

import { gsap } from "gsap"
import { ArrowRightIcon, MailIcon } from "lucide-react"
import {
  type CSSProperties,
  type FormEvent,
  useActionState,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { toast } from "sonner"

import { subscribeAction } from "@/app/p/[slug]/actions"
import { SubmitButton } from "@/components/submit-button"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { initialActionState } from "@/lib/action-state"
import { getAnalyticsIdentifiers } from "@/lib/analytics-client"
import { getThemeForeground } from "@/lib/campaign-presets"
import type { CampaignSubscriptionLayout } from "@/lib/campaign-template-schemes"
import { commonEmailDomainError, isCommonEmailAddress } from "@/lib/common-email-domains"
import { cn } from "@/lib/utils"
import type { CampaignQuestion, CampaignQuestionnaire, CampaignTemplate } from "@/types/database"

interface SubscribeFormProps {
  slug: string
  emailLabel: string
  buttonLabel: string
  successMessage: string
  themeColor: string
  template: CampaignTemplate
  subscriptionLayout: CampaignSubscriptionLayout
  questionnaire: CampaignQuestionnaire
  variant?: "light" | "dark"
}

type EmailFeedback = {
  message: string
  status: "idle" | "invalid" | "valid"
}

const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const initialEmailFeedback: EmailFeedback = {
  message: "",
  status: "idle",
}

function getEmailFeedback(value: string): EmailFeedback {
  const email = value.trim()

  if (!email) {
    return initialEmailFeedback
  }

  if (!emailShape.test(email)) {
    return {
      message: "请输入完整邮箱，例如 name@email.com",
      status: "invalid",
    }
  }

  if (!isCommonEmailAddress(email)) {
    return {
      message: commonEmailDomainError,
      status: "invalid",
    }
  }

  return {
    message: "邮箱格式可用，提交后即可加入预约",
    status: "valid",
  }
}

type AnswerControl = HTMLInputElement | HTMLTextAreaElement

function getAnswerControls(form: HTMLFormElement, name: string) {
  return Array.from(form.elements).filter(
    (element): element is AnswerControl =>
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
      element.name === name
  )
}

function focusInvalidControl(control: AnswerControl) {
  control.focus({ preventScroll: true })
  control.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "center",
  })
}

function syncAnalyticsIdentifiers(form: HTMLFormElement) {
  const { sessionId, visitorId } = getAnalyticsIdentifiers()
  const visitorInput = form.elements.namedItem("visitorId")
  const sessionInput = form.elements.namedItem("sessionId")

  if (visitorInput instanceof HTMLInputElement) {
    visitorInput.value = visitorId
  }

  if (sessionInput instanceof HTMLInputElement) {
    sessionInput.value = sessionId
  }
}

function QuestionnaireField({
  question,
  index,
  variant,
  namePrefix = "",
  form,
  activeEditorTarget,
}: {
  question: CampaignQuestion
  index: number
  variant: "light" | "dark"
  namePrefix?: string
  form?: string
  activeEditorTarget?: string
}) {
  const fieldName = `${namePrefix}answer-${question.id}`
  const isDark = variant === "dark"
  const editorTarget = `question-${question.id}`

  return (
    <Field
      className="campaign-question"
      data-public-question
      data-question-type={question.type}
      data-editor-target={editorTarget}
      data-editor-active={activeEditorTarget === editorTarget ? true : undefined}
    >
      <div className="campaign-question-layout">
        <div className="campaign-question-body">
          <div className="campaign-question-heading">
            <span
              className={cn(
                "campaign-question-index font-mono text-[10px]",
                isDark ? "text-white/40" : "text-black/40"
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <FieldLabel
              htmlFor={question.type === "short_text" ? fieldName : undefined}
              className={cn(
                "campaign-question-label block text-sm leading-snug",
                isDark ? "text-white/85" : "text-black/80"
              )}
            >
              {question.label}
              {question.required ? (
                <>
                  <span className="ml-1 text-[var(--subscribe-color)]" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">（必填）</span>
                </>
              ) : null}
            </FieldLabel>
          </div>

          {question.type === "short_text" ? (
            <Textarea
              id={fieldName}
              name={fieldName}
              form={form}
              rows={2}
              maxLength={500}
              required={question.required}
              placeholder={question.placeholder}
              className={cn(
                "campaign-question-answer mt-3 min-h-20 resize-none rounded-[3px] border-0 px-3 py-3 leading-relaxed shadow-none caret-[var(--subscribe-color)] focus-visible:border-0",
                isDark
                  ? "bg-white/[0.11] text-white/95 placeholder:text-white/58 focus-visible:bg-white/[0.14]"
                  : "bg-black/[0.065] text-neutral-950 placeholder:text-black/52 focus-visible:bg-black/[0.085]"
              )}
            />
          ) : (
            <fieldset className="campaign-question-options mt-3 grid gap-2">
              <legend className="sr-only">{question.label}</legend>
              {question.options.map((option, optionIndex) => {
                const inputId = `${fieldName}-${optionIndex}`
                const isMultiple = question.type === "multiple_choice"

                return (
                  <label
                    key={option}
                    htmlFor={inputId}
                    className={cn(
                      "campaign-question-option group/option grid min-h-10 cursor-pointer grid-cols-[18px_1fr] items-start gap-3 border-0 px-3 py-2 text-sm transition-[background-color,color,transform]",
                      isDark
                        ? "bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white"
                        : "bg-black/[0.05] text-black/65 hover:bg-black/[0.09] hover:text-black",
                      "has-checked:bg-[color-mix(in_srgb,var(--subscribe-color)_16%,transparent)] has-checked:text-current"
                    )}
                  >
                    <input
                      id={inputId}
                      type={isMultiple ? "checkbox" : "radio"}
                      name={fieldName}
                      form={form}
                      value={option}
                      required={!isMultiple && question.required}
                      className="campaign-question-control size-4 shrink-0 cursor-pointer"
                    />
                    <span className="min-w-0 break-words">{option}</span>
                  </label>
                )
              })}
            </fieldset>
          )}
        </div>
      </div>
    </Field>
  )
}

function SubscriptionEmailField({
  activeEditorTarget,
  buttonLabel,
  emailLabel,
  form,
  preview = false,
  slug,
  themeColor,
  variant,
}: {
  activeEditorTarget?: string
  buttonLabel: string
  emailLabel: string
  form?: string
  preview?: boolean
  slug: string
  themeColor: string
  variant: "light" | "dark"
}) {
  const emailId = `email-${slug}`
  const [clientFeedback, setClientFeedback] = useState<EmailFeedback>(initialEmailFeedback)
  const fieldRef = useRef<HTMLDivElement>(null)
  const feedback = clientFeedback

  useLayoutEffect(() => {
    if (
      feedback.status !== "invalid" ||
      !fieldRef.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        fieldRef.current,
        { x: -4 },
        { x: 0, duration: 0.45, ease: "elastic.out(1, 0.35)" }
      )
    }, fieldRef)

    return () => context.revert()
  }, [feedback.status])

  function updateEmailFeedback(input: HTMLInputElement, showError = false) {
    const nextFeedback = getEmailFeedback(input.value)
    setClientFeedback(nextFeedback)

    if (showError && nextFeedback.status === "invalid") {
      toast.error(nextFeedback.message, { id: `${emailId}-error` })
    }
  }

  return (
    <div className="campaign-subscribe-email-panel" data-public-email>
      <div className="campaign-subscribe-email-question">
        <div className="campaign-subscribe-email-body">
          <div className="campaign-subscribe-email-heading">
            <FieldLabel
              htmlFor={emailId}
              className={cn(
                "campaign-subscribe-email-label text-sm leading-snug",
                variant === "dark" ? "text-white/85" : "text-black/80"
              )}
              data-editor-target={preview ? "email-label" : undefined}
              data-editor-active={
                preview && activeEditorTarget === "email-label" ? true : undefined
              }
            >
              {emailLabel}
              <span className="ml-1 text-[var(--subscribe-color)]" aria-hidden="true">
                *
              </span>
              <span className="sr-only">（必填）</span>
            </FieldLabel>
          </div>
          <div
            className="campaign-subscribe-email-row flex flex-col gap-2.5 sm:flex-row"
            data-editor-target={preview ? "button-label" : undefined}
            data-editor-active={preview && activeEditorTarget === "button-label" ? true : undefined}
          >
            <FieldGroup className="min-w-0 flex-1">
              <Field data-invalid={feedback.status === "invalid"}>
                <InputGroup
                  ref={fieldRef}
                  className={cn(
                    "campaign-subscribe-field border-0 shadow-none",
                    variant === "dark"
                      ? "bg-white/10 text-white"
                      : "bg-black/[0.06] text-neutral-950"
                  )}
                  data-feedback-status={feedback.status}
                >
                  <InputGroupInput
                    id={emailId}
                    name={preview ? `${slug}-email` : "email"}
                    size={30}
                    form={form}
                    type="email"
                    autoComplete={preview ? "off" : "email"}
                    placeholder="name@email.com"
                    aria-invalid={feedback.status === "invalid"}
                    className={cn(
                      "campaign-subscribe-input",
                      variant === "dark" ? "placeholder:text-white/45" : undefined
                    )}
                    onBlur={(event) => {
                      if (event.currentTarget.value.trim()) {
                        updateEmailFeedback(event.currentTarget, true)
                      }
                    }}
                    onInput={(event) => updateEmailFeedback(event.currentTarget)}
                    required
                  />
                  <InputGroupAddon className="campaign-subscribe-addon">
                    <MailIcon aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </FieldGroup>
            {preview ? (
              <Button
                type="button"
                className="campaign-subscribe-button max-w-full border-0 text-center whitespace-normal"
                style={{
                  backgroundColor: themeColor,
                  color: getThemeForeground(themeColor),
                }}
              >
                <span className="campaign-subscribe-button-label">{buttonLabel}</span>
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            ) : (
              <SubmitButton
                className="campaign-subscribe-button max-w-full border-0 text-center whitespace-normal"
                style={{
                  backgroundColor: themeColor,
                  color: getThemeForeground(themeColor),
                }}
                pendingLabel="提交中"
              >
                <span className="campaign-subscribe-button-label">{buttonLabel}</span>
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </SubmitButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SubscribeForm({
  slug,
  emailLabel,
  buttonLabel,
  successMessage,
  themeColor,
  template,
  subscriptionLayout,
  questionnaire,
  variant = "light",
}: SubscribeFormProps) {
  const [state, formAction] = useActionState(subscribeAction, initialActionState)
  const formRef = useRef<HTMLFormElement>(null)
  const style = {
    "--subscribe-color": themeColor,
    "--subscribe-foreground": getThemeForeground(themeColor),
  } as CSSProperties

  useEffect(() => {
    if (formRef.current) {
      syncAnalyticsIdentifiers(formRef.current)
    }
  }, [])

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message, { id: `subscribe-${slug}-error` })
      return
    }

    if (state.status !== "success") {
      return
    }

    toast.success(successMessage || state.message || "预约成功", {
      id: `subscribe-${slug}-success`,
    })
    formRef.current?.reset()
    if (formRef.current) {
      syncAnalyticsIdentifiers(formRef.current)
    }
    const emailInput = formRef.current?.elements.namedItem("email")
    if (emailInput instanceof HTMLInputElement) {
      emailInput.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }, [slug, state, successMessage])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget
    syncAnalyticsIdentifiers(form)

    if (questionnaire.enabled) {
      for (const question of questionnaire.questions) {
        if (!question.required) {
          continue
        }

        const controls = getAnswerControls(form, `answer-${question.id}`)
        const answered = controls.some((control) => {
          if (
            control instanceof HTMLInputElement &&
            (control.type === "radio" || control.type === "checkbox")
          ) {
            return control.checked
          }

          return control.value.trim().length > 0
        })

        if (!answered && controls[0]) {
          event.preventDefault()
          toast.error(`请完成“${question.label}”`, {
            id: `subscribe-${slug}-required-question`,
          })
          focusInvalidControl(controls[0])
          return
        }
      }
    }

    const emailInput = form.elements.namedItem("email")
    if (!(emailInput instanceof HTMLInputElement)) {
      return
    }

    const emailFeedback = emailInput.value.trim()
      ? getEmailFeedback(emailInput.value)
      : { message: "请输入邮箱地址", status: "invalid" as const }

    if (emailFeedback.status === "invalid") {
      event.preventDefault()
      toast.error(emailFeedback.message, { id: `email-${slug}-error` })
      focusInvalidControl(emailInput)
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="campaign-subscribe flex w-full max-w-2xl flex-col gap-5"
      data-template={template}
      data-tone={variant}
      data-questionnaire={questionnaire.enabled && questionnaire.questions.length > 0}
      data-subscription-layout={subscriptionLayout}
      style={style}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="visitorId" />
      <input type="hidden" name="sessionId" />
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`company-${slug}`}>Company</label>
        <input id={`company-${slug}`} name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="campaign-subscribe-fields">
        {questionnaire.enabled && questionnaire.questions.length > 0 ? (
          <section
            className="campaign-questionnaire py-1"
            aria-labelledby={`questionnaire-title-${slug}`}
          >
            <header className="campaign-questionnaire-header">
              <div
                className={cn(
                  "campaign-questionnaire-count font-mono text-[9px]",
                  variant === "dark" ? "text-white/40" : "text-black/40"
                )}
              >
                {questionnaire.questions.length} 个问题
              </div>
              <div>
                <h2
                  id={`questionnaire-title-${slug}`}
                  className="campaign-questionnaire-title mt-1 max-w-xl font-display text-2xl leading-tight sm:text-3xl"
                >
                  {questionnaire.title}
                </h2>
                {questionnaire.description ? (
                  <p
                    className={cn(
                      "mt-2 max-w-xl text-xs leading-relaxed sm:text-sm",
                      variant === "dark" ? "text-white/45" : "text-black/50"
                    )}
                  >
                    {questionnaire.description}
                  </p>
                ) : null}
              </div>
            </header>
            <div className="campaign-question-list">
              {questionnaire.questions.map((question, index) => (
                <QuestionnaireField
                  key={question.id}
                  question={question}
                  index={index}
                  variant={variant}
                />
              ))}
            </div>
          </section>
        ) : null}

        <SubscriptionEmailField
          slug={slug}
          emailLabel={emailLabel}
          buttonLabel={buttonLabel}
          themeColor={themeColor}
          variant={variant}
        />
      </div>
    </form>
  )
}

export function SubscribeFormPreview({
  activeEditorTarget,
  slug,
  emailLabel,
  buttonLabel,
  themeColor,
  template,
  subscriptionLayout,
  questionnaire,
  variant = "light",
}: Omit<SubscribeFormProps, "successMessage"> & { activeEditorTarget?: string }) {
  const style = {
    "--subscribe-color": themeColor,
    "--subscribe-foreground": getThemeForeground(themeColor),
  } as CSSProperties
  const previewFormId = `${slug}-non-submit`

  return (
    <section
      className="campaign-subscribe flex w-full max-w-2xl flex-col gap-5"
      data-template={template}
      data-tone={variant}
      data-questionnaire={questionnaire.enabled && questionnaire.questions.length > 0}
      data-subscription-layout={subscriptionLayout}
      data-preview-questionnaire={
        questionnaire.enabled && questionnaire.questions.length > 0 ? true : undefined
      }
      style={style}
      aria-label="预约表单预览"
    >
      <div className="campaign-subscribe-fields">
        {questionnaire.enabled && questionnaire.questions.length > 0 ? (
          <section
            className="campaign-questionnaire py-1"
            aria-labelledby={`questionnaire-title-${slug}`}
          >
            <header className="campaign-questionnaire-header">
              <div
                className={cn(
                  "campaign-questionnaire-count font-mono text-[9px]",
                  variant === "dark" ? "text-white/40" : "text-black/40"
                )}
              >
                {questionnaire.questions.length} 个问题
              </div>
              <div>
                <h2
                  id={`questionnaire-title-${slug}`}
                  className="campaign-questionnaire-title mt-1 max-w-xl font-display text-2xl leading-tight sm:text-3xl"
                  data-editor-target="questionnaire-title"
                  data-editor-active={
                    activeEditorTarget === "questionnaire-title" ? true : undefined
                  }
                >
                  {questionnaire.title}
                </h2>
                {questionnaire.description ? (
                  <p
                    className={cn(
                      "mt-2 max-w-xl text-xs leading-relaxed sm:text-sm",
                      variant === "dark" ? "text-white/45" : "text-black/50"
                    )}
                    data-editor-target="questionnaire-description"
                    data-editor-active={
                      activeEditorTarget === "questionnaire-description" ? true : undefined
                    }
                  >
                    {questionnaire.description}
                  </p>
                ) : null}
              </div>
            </header>
            <div className="campaign-question-list">
              {questionnaire.questions.map((question, index) => (
                <QuestionnaireField
                  key={question.id}
                  question={question}
                  index={index}
                  variant={variant}
                  namePrefix={`${slug}-`}
                  form={previewFormId}
                  activeEditorTarget={activeEditorTarget}
                />
              ))}
            </div>
          </section>
        ) : null}

        <SubscriptionEmailField
          activeEditorTarget={activeEditorTarget}
          slug={slug}
          emailLabel={emailLabel}
          buttonLabel={buttonLabel}
          themeColor={themeColor}
          variant={variant}
          form={previewFormId}
          preview
        />
      </div>
    </section>
  )
}

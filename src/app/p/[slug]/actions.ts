"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { demoCampaignSlug, getPublicCampaign } from "@/lib/campaigns"
import { resolveRequestLocation } from "@/lib/request-location"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { type ActionState, emailSchema, initialActionState } from "@/lib/validation"
import type { CampaignQuestionAnswers, CampaignQuestionnaire, Json } from "@/types/database"

const subscribeSchema = z.object({
  email: emailSchema,
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  company: z.string().max(0),
})

const pageViewSchema = z.object({
  campaign: z.string().trim().max(120).nullable(),
  deviceType: z.enum(["desktop", "mobile", "tablet", "unknown"]),
  locale: z.string().trim().max(35).nullable(),
  medium: z.string().trim().max(80).nullable(),
  referrerHost: z.string().trim().max(253).nullable(),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  source: z.string().trim().max(80).nullable(),
  timezone: z.string().trim().max(64).nullable(),
  viewId: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
  visitorId: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
})

const analyticsIdentifierSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{16,128}$/)
  .nullable()

export async function trackPageViewAction(payload: unknown) {
  const result = pageViewSchema.safeParse(payload)

  if (!result.success || result.data.slug === demoCampaignSlug) {
    return
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return
  }

  const requestHeaders = await headers()
  const location = await resolveRequestLocation(requestHeaders)

  await supabase.rpc("track_campaign_page_view", {
    p_campaign: result.data.campaign,
    p_city: location.city,
    p_country_code: location.countryCode,
    p_device_type: result.data.deviceType,
    p_locale: result.data.locale,
    p_medium: result.data.medium,
    p_referrer_host: result.data.referrerHost,
    p_region: location.region,
    p_session_id: result.data.sessionId,
    p_slug: result.data.slug,
    p_source: result.data.source,
    p_timezone: result.data.timezone,
    p_view_id: result.data.viewId,
    p_visitor_id: result.data.visitorId,
  })
}

function parseQuestionnaireAnswers(
  questionnaire: CampaignQuestionnaire,
  formData: FormData
):
  | { success: true; answers: CampaignQuestionAnswers }
  | { success: false; fieldErrors: Record<string, string[]> } {
  if (!questionnaire.enabled) {
    return { success: true, answers: {} }
  }

  const answers: CampaignQuestionAnswers = {}
  const fieldErrors: Record<string, string[]> = {}

  for (const question of questionnaire.questions) {
    const fieldName = `answer-${question.id}`

    if (question.type === "multiple_choice") {
      const values = formData
        .getAll(fieldName)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
      const validValues = [...new Set(values)].filter((value) => question.options.includes(value))

      if (question.required && validValues.length === 0) {
        fieldErrors[fieldName] = ["请至少选择一项"]
      } else if (validValues.length > 0) {
        answers[question.id] = validValues
      }
      continue
    }

    const rawValue = formData.get(fieldName)
    const value = typeof rawValue === "string" ? rawValue.trim() : ""

    if (question.required && !value) {
      fieldErrors[fieldName] = ["请填写这一项"]
      continue
    }

    if (!value) {
      continue
    }

    if (question.type === "single_choice" && !question.options.includes(value)) {
      fieldErrors[fieldName] = ["请选择有效选项"]
      continue
    }

    if (question.type === "short_text" && value.length > 500) {
      fieldErrors[fieldName] = ["回答不能超过 500 个字符"]
      continue
    }

    answers[question.id] = value
  }

  return Object.keys(fieldErrors).length > 0
    ? { success: false, fieldErrors }
    : { success: true, answers }
}

export async function subscribeAction(
  _previousState: ActionState = initialActionState,
  formData: FormData
): Promise<ActionState> {
  const result = subscribeSchema.safeParse({
    email: formData.get("email"),
    slug: formData.get("slug"),
    company: formData.get("company"),
  })
  const visitorIdResult = analyticsIdentifierSchema.safeParse(formData.get("visitorId") || null)
  const sessionIdResult = analyticsIdentifierSchema.safeParse(formData.get("sessionId") || null)

  if (!result.success) {
    if (formData.get("company")) {
      return { status: "success", message: "预约成功" }
    }

    const fieldErrors = result.error.flatten().fieldErrors

    return {
      status: "error",
      message: fieldErrors.email?.[0] ?? "请输入有效的邮箱地址",
      fieldErrors,
    }
  }

  const campaign = await getPublicCampaign(result.data.slug)

  if (!campaign) {
    return {
      status: "error",
      message: "该订阅页面已下线",
    }
  }

  if (!campaign.config.sectionVisibility.signup) {
    return {
      status: "error",
      message: "该订阅页面已关闭预约",
    }
  }

  const questionnaireResult = parseQuestionnaireAnswers(campaign.config.questionnaire, formData)

  if (!questionnaireResult.success) {
    return {
      status: "error",
      message: "请完成标记的问题",
      fieldErrors: questionnaireResult.fieldErrors,
    }
  }

  if (result.data.slug === demoCampaignSlug) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      status: "success",
      message: "示例预约成功，示例页面不会保存邮箱。",
    }
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      status: "success",
      message: "演示预约成功。连接 Supabase 后将持久保存订阅信息。",
    }
  }

  const { error } = await supabase.rpc("subscribe_to_campaign", {
    p_answers: questionnaireResult.answers as Json,
    p_email: result.data.email,
    p_session_id: sessionIdResult.success ? sessionIdResult.data : null,
    p_slug: result.data.slug,
    p_visitor_id: visitorIdResult.success ? visitorIdResult.data : null,
  })

  if (error) {
    return {
      status: "error",
      message: error.message.includes("not found") ? "该订阅页面已下线" : "提交失败，请稍后重试",
    }
  }

  return {
    status: "success",
    message: "预约成功，我们会在开放时通知你。",
  }
}

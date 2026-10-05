"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { deleteCampaignMedia } from "@/lib/campaign-media"
import { createCampaignConfig } from "@/lib/campaign-presets"
import { createCampaignVersion } from "@/lib/campaign-version"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { type ActionState, campaignConfigSchema, initialActionState } from "@/lib/validation"
import { type CampaignConfig, campaignTemplateValues } from "@/types/database"

const campaignNameSchema = z.string().trim().min(2).max(80)
const campaignTemplateSchema = z.enum(campaignTemplateValues)
const campaignIdSchema = z.string().min(1).max(80)
const campaignSlugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .max(80)
const subscriberIdSchema = z.string().min(1).max(80)
const profileSchema = z.object({
  fullName: z.string().trim().min(2, "名称至少需要 2 个字符").max(48, "名称不能超过 48 个字符"),
})

function createSlug(name: string) {
  const readable = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36)
  const suffix = crypto.randomUUID().slice(0, 8)

  return readable ? `${readable}-${suffix}` : `campaign-${suffix}`
}

function parseJsonFormValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

async function getAuthenticatedContext() {
  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return { supabase: null, user: null, isDemo: true } as const
  }

  const { data, error } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : ""

  if (error || !userId) {
    redirect("/login")
  }

  return { supabase, userId, isDemo: false } as const
}

export async function createCampaignAction(formData: FormData) {
  const name = campaignNameSchema.safeParse(formData.get("name"))
  const template = campaignTemplateSchema.safeParse(formData.get("template") ?? "launch")

  if (!name.success || !template.success) {
    redirect("/dashboard/new?error=invalid-project")
  }

  const context = await getAuthenticatedContext()

  if (context.isDemo) {
    redirect("/dashboard/campaigns/demo-launch/edit")
  }

  const { data, error } = await context.supabase
    .from("subscription_campaigns")
    .insert({
      user_id: context.userId,
      name: name.data,
      slug: createSlug(name.data),
      draft_config: createCampaignConfig(template.data),
    })
    .select("id")
    .single()

  if (error) {
    redirect(`/dashboard/new?error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/dashboard/campaigns/${data.id}/edit`)
}

export async function updateCampaignAction(
  _previousState: ActionState = initialActionState,
  formData: FormData
): Promise<ActionState> {
  const result = campaignConfigSchema.safeParse({
    name: formData.get("name"),
    title: formData.get("title"),
    slogan: formData.get("slogan"),
    description: formData.get("description"),
    featureTitle: formData.get("featureTitle"),
    featureDescription: formData.get("featureDescription"),
    eyebrow: formData.get("eyebrow"),
    emailLabel: formData.get("emailLabel"),
    buttonLabel: formData.get("buttonLabel"),
    successMessage: formData.get("successMessage"),
    coverImage: formData.get("coverImage"),
    coverImagePosition: parseJsonFormValue(formData.get("coverImagePosition")),
    previewVideo: parseJsonFormValue(formData.get("previewVideo")),
    themeColor: formData.get("themeColor"),
    template: formData.get("template"),
    motion: formData.get("motion"),
    motionSettings: parseJsonFormValue(formData.get("motionSettings")),
    questionnaire: parseJsonFormValue(formData.get("questionnaire")),
    pageContent: parseJsonFormValue(formData.get("pageContent")),
    sectionVisibility: parseJsonFormValue(formData.get("sectionVisibility")),
    sectionOrder: parseJsonFormValue(formData.get("sectionOrder")),
    header: parseJsonFormValue(formData.get("header")),
    marquee: parseJsonFormValue(formData.get("marquee")),
    countdown: parseJsonFormValue(formData.get("countdown")),
    intent: formData.get("intent"),
  })
  const campaignId = campaignIdSchema.safeParse(formData.get("campaignId"))
  const campaignSlug = campaignSlugSchema.safeParse(formData.get("slug"))

  if (!result.success || !campaignId.success || !campaignSlug.success) {
    return {
      status: "error",
      message: "请修正标记的配置项",
      fieldErrors: result.success ? undefined : result.error.flatten().fieldErrors,
    }
  }

  const context = await getAuthenticatedContext()
  const isPublishing = result.data.intent === "publish"
  const config: CampaignConfig = {
    title: result.data.title,
    slogan: result.data.slogan,
    description: result.data.description,
    featureTitle: result.data.featureTitle,
    featureDescription: result.data.featureDescription,
    eyebrow: result.data.eyebrow,
    emailLabel: result.data.emailLabel,
    buttonLabel: result.data.buttonLabel,
    successMessage: result.data.successMessage,
    coverImage: result.data.coverImage,
    coverImagePosition: result.data.coverImagePosition,
    previewVideo: result.data.previewVideo,
    themeColor: result.data.themeColor,
    template: result.data.template,
    motion: result.data.motion,
    motionSettings: result.data.motionSettings,
    questionnaire: result.data.questionnaire,
    pageContent: result.data.pageContent,
    sectionVisibility: result.data.sectionVisibility,
    sectionOrder: result.data.sectionOrder,
    header: result.data.header,
    marquee: result.data.marquee,
    countdown: result.data.countdown,
  }

  if (context.isDemo) {
    return {
      status: "success",
      message: isPublishing
        ? "演示项目已模拟发布，连接 Supabase 后可持久保存。"
        : "演示草稿已模拟保存，连接 Supabase 后可持久保存。",
      version: isPublishing ? createCampaignVersion(config) : undefined,
    }
  }

  const { error } = await context.supabase
    .from("subscription_campaigns")
    .update({
      name: result.data.name,
      draft_config: config,
      ...(isPublishing
        ? {
            status: "published" as const,
            published_config: config,
            published_at: new Date().toISOString(),
          }
        : {}),
    })
    .eq("id", campaignId.data)
    .eq("user_id", context.userId)

  if (error) {
    return { status: "error", message: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/projects")
  revalidatePath(`/dashboard/campaigns/${campaignId.data}/edit`)
  revalidatePath(`/p/${campaignSlug.data}`)

  return {
    status: "success",
    message: isPublishing ? "已发布最新版本" : "草稿已保存",
    version: isPublishing ? createCampaignVersion(config) : undefined,
  }
}

export async function togglePublicationAction(formData: FormData) {
  const campaignId = campaignIdSchema.safeParse(formData.get("campaignId"))
  const campaignSlug = campaignSlugSchema.safeParse(formData.get("slug"))
  const nextStatus = z.enum(["draft", "published"]).safeParse(formData.get("nextStatus"))

  if (!campaignId.success || !campaignSlug.success || !nextStatus.success) {
    redirect("/dashboard?error=invalid-campaign")
  }

  const context = await getAuthenticatedContext()

  if (context.isDemo) {
    revalidatePath("/dashboard")
    return
  }

  if (nextStatus.data === "published") {
    const { data, error: readError } = await context.supabase
      .from("subscription_campaigns")
      .select("draft_config")
      .eq("id", campaignId.data)
      .eq("user_id", context.userId)
      .single()

    if (readError || !data) {
      redirect(`/dashboard?error=${encodeURIComponent("无法读取待发布草稿")}`)
    }

    const { error: publishError } = await context.supabase
      .from("subscription_campaigns")
      .update({
        status: "published",
        published_config: data.draft_config,
        published_at: new Date().toISOString(),
      })
      .eq("id", campaignId.data)
      .eq("user_id", context.userId)

    if (publishError) {
      redirect(`/dashboard?error=${encodeURIComponent(publishError.message)}`)
    }
  } else {
    const { error: withdrawError } = await context.supabase
      .from("subscription_campaigns")
      .update({ status: "draft" })
      .eq("id", campaignId.data)
      .eq("user_id", context.userId)

    if (withdrawError) {
      redirect(`/dashboard?error=${encodeURIComponent(withdrawError.message)}`)
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/projects")
  revalidatePath(`/p/${campaignSlug.data}`)
}

export async function deleteCampaignAction(formData: FormData) {
  const campaignId = campaignIdSchema.safeParse(formData.get("campaignId"))

  if (!campaignId.success) {
    return
  }

  const context = await getAuthenticatedContext()

  if (!context.isDemo) {
    const { data: campaign, error: campaignError } = await context.supabase
      .from("subscription_campaigns")
      .select("slug")
      .eq("id", campaignId.data)
      .eq("user_id", context.userId)
      .maybeSingle()

    if (campaignError || !campaign) {
      redirect(
        `/dashboard?error=${encodeURIComponent(campaignError?.message ?? "无法读取待删除项目")}`
      )
    }

    try {
      await deleteCampaignMedia(
        context.supabase.storage.from("campaign-media"),
        context.userId,
        campaignId.data
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法清理项目媒体"
      redirect(`/dashboard?error=${encodeURIComponent(message)}`)
    }

    const { error } = await context.supabase
      .from("subscription_campaigns")
      .delete()
      .eq("id", campaignId.data)
      .eq("user_id", context.userId)

    if (error) {
      redirect(`/dashboard?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath(`/p/${campaign.slug}`)
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/projects")
}

export async function deleteSubscriberAction(formData: FormData) {
  const campaignId = campaignIdSchema.safeParse(formData.get("campaignId"))
  const subscriberId = subscriberIdSchema.safeParse(formData.get("subscriberId"))

  if (!campaignId.success || !subscriberId.success) {
    return
  }

  const context = await getAuthenticatedContext()

  if (!context.isDemo) {
    const { data: campaign, error: campaignError } = await context.supabase
      .from("subscription_campaigns")
      .select("id, status")
      .eq("id", campaignId.data)
      .eq("user_id", context.userId)
      .maybeSingle()

    if (campaignError || campaign?.status !== "published") {
      redirect(`/dashboard?error=${encodeURIComponent("只有已发布项目可以管理预约名单")}`)
    }

    const { error } = await context.supabase
      .from("subscribers")
      .delete()
      .eq("id", subscriberId.data)
      .eq("campaign_id", campaignId.data)

    if (error) {
      redirect(
        `/dashboard/campaigns/${campaignId.data}/subscribers?error=${encodeURIComponent(error.message)}`
      )
    }
  }

  revalidatePath(`/dashboard/campaigns/${campaignId.data}/subscribers`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/projects")
}

export async function updateProfileAction(
  _previousState: ActionState = initialActionState,
  formData: FormData
): Promise<ActionState> {
  const result = profileSchema.safeParse({
    fullName: formData.get("fullName"),
  })

  if (!result.success) {
    return {
      status: "error",
      message: "请检查账号资料",
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  const context = await getAuthenticatedContext()

  if (context.isDemo) {
    return {
      status: "success",
      message: "演示账号资料不会持久保存",
    }
  }

  const { error } = await context.supabase
    .from("users")
    .update({ full_name: result.data.fullName })
    .eq("id", context.userId)

  if (error) {
    return { status: "error", message: error.message }
  }

  revalidatePath("/dashboard", "layout")
  revalidatePath("/dashboard/account")

  return {
    status: "success",
    message: "账号资料已更新",
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  redirect("/")
}

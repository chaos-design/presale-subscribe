import { z } from "zod"

import { isMotionAvailableForTemplate } from "@/lib/campaign-presets"
import { commonEmailDomainError, isCommonEmailAddress } from "@/lib/common-email-domains"
import { campaignBodySectionValues, campaignTemplateValues } from "@/types/database"

export const emailSchema = z
  .string()
  .trim()
  .min(1, "请输入邮箱地址")
  .email("请输入有效的邮箱地址")
  .max(254, "邮箱地址过长")
  .refine(isCommonEmailAddress, commonEmailDomainError)

export const campaignQuestionSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, "题目标识无效")
      .max(64, "题目标识过长"),
    label: z.string().trim().min(2, "问题至少需要 2 个字符").max(120, "问题不能超过 120 个字符"),
    type: z.enum(["short_text", "single_choice", "multiple_choice"]),
    required: z.boolean(),
    placeholder: z.string().trim().max(120, "占位提示不能超过 120 个字符"),
    options: z
      .array(z.string().trim().min(1, "选项不能为空").max(60, "选项不能超过 60 个字符"))
      .max(8, "每道题最多 8 个选项"),
  })
  .superRefine((question, context) => {
    if (question.type !== "short_text" && question.options.length < 2) {
      context.addIssue({
        code: "custom",
        message: "选择题至少需要 2 个选项",
        path: ["options"],
      })
    }

    if (new Set(question.options).size !== question.options.length) {
      context.addIssue({
        code: "custom",
        message: "同一道题不能使用重复选项",
        path: ["options"],
      })
    }
  })

export const campaignQuestionnaireSchema = z
  .object({
    enabled: z.boolean(),
    title: z
      .string()
      .trim()
      .min(2, "问卷标题至少需要 2 个字符")
      .max(80, "问卷标题不能超过 80 个字符"),
    description: z.string().trim().max(240, "问卷说明不能超过 240 个字符"),
    questions: z.array(campaignQuestionSchema).max(6, "每份问卷最多 6 道题"),
  })
  .superRefine((questionnaire, context) => {
    if (questionnaire.enabled && questionnaire.questions.length === 0) {
      context.addIssue({
        code: "custom",
        message: "启用问卷时至少需要 1 道题",
        path: ["questions"],
      })
    }

    const ids = questionnaire.questions.map((question) => question.id)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "问卷题目标识不能重复",
        path: ["questions"],
      })
    }
  })

const campaignPageItemSchema = z.object({
  label: z.string().trim().min(1, "区块标识不能为空").max(40, "区块标识不能超过 40 个字符"),
  title: z
    .string()
    .trim()
    .min(2, "区块标题至少需要 2 个字符")
    .max(100, "区块标题不能超过 100 个字符"),
  description: z
    .string()
    .trim()
    .min(6, "区块说明至少需要 6 个字符")
    .max(260, "区块说明不能超过 260 个字符"),
})

export const campaignPageContentSchema = z.object({
  sectionEyebrow: z
    .string()
    .trim()
    .min(2, "内容段标识至少需要 2 个字符")
    .max(48, "内容段标识不能超过 48 个字符"),
  highlights: z.array(campaignPageItemSchema).min(1, "至少需要 1 个核心亮点").max(6),
  timelineTitle: z
    .string()
    .trim()
    .min(2, "发布节奏标题至少需要 2 个字符")
    .max(120, "发布节奏标题不能超过 120 个字符"),
  timelineDescription: z
    .string()
    .trim()
    .min(10, "发布节奏说明至少需要 10 个字符")
    .max(500, "发布节奏说明不能超过 500 个字符"),
  milestones: z.array(campaignPageItemSchema).min(1, "至少需要 1 个发布节点").max(6),
  closingTitle: z
    .string()
    .trim()
    .min(2, "预约标题至少需要 2 个字符")
    .max(120, "预约标题不能超过 120 个字符"),
  closingDescription: z
    .string()
    .trim()
    .min(10, "预约说明至少需要 10 个字符")
    .max(400, "预约说明不能超过 400 个字符"),
})

const campaignCountdownSchema = z
  .object({
    completeLabel: z
      .string()
      .trim()
      .min(1, "结束文案不能为空")
      .max(40, "结束文案不能超过 40 个字符"),
    enabled: z.boolean(),
    label: z.string().trim().min(1, "倒计时标题不能为空").max(40, "倒计时标题不能超过 40 个字符"),
    targetAt: z.string().trim().max(40, "目标时间过长"),
  })
  .superRefine((countdown, context) => {
    if (!countdown.enabled) {
      return
    }

    if (!countdown.targetAt || Number.isNaN(Date.parse(countdown.targetAt))) {
      context.addIssue({
        code: "custom",
        message: "请设置有效的倒计时目标时间",
        path: ["targetAt"],
      })
    }
  })

export const campaignConfigSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "项目名称至少需要 2 个字符")
      .max(80, "项目名称不能超过 80 个字符"),
    title: z.string().trim().min(2, "标题至少需要 2 个字符").max(160, "标题不能超过 160 个字符"),
    slogan: z
      .string()
      .trim()
      .min(2, "Slogan 至少需要 2 个字符")
      .max(96, "Slogan 不能超过 96 个字符"),
    description: z
      .string()
      .trim()
      .min(10, "描述至少需要 10 个字符")
      .max(600, "描述不能超过 600 个字符"),
    featureTitle: z
      .string()
      .trim()
      .min(2, "功能介绍标题至少需要 2 个字符")
      .max(120, "功能介绍标题不能超过 120 个字符"),
    featureDescription: z
      .string()
      .trim()
      .min(10, "功能介绍正文至少需要 10 个字符")
      .max(600, "功能介绍正文不能超过 600 个字符"),
    eyebrow: z.string().trim().max(48, "眉标题不能超过 48 个字符"),
    emailLabel: z
      .string()
      .trim()
      .min(2, "邮箱标题至少需要 2 个字符")
      .max(60, "邮箱标题不能超过 60 个字符"),
    buttonLabel: z
      .string()
      .trim()
      .min(2, "按钮文字至少需要 2 个字符")
      .max(32, "按钮文字不能超过 32 个字符"),
    successMessage: z
      .string()
      .trim()
      .min(2, "成功提示至少需要 2 个字符")
      .max(160, "成功提示不能超过 160 个字符"),
    coverImage: z
      .string()
      .trim()
      .max(4096, "图片 URL 不能超过 4096 个字符")
      .refine((value) => value === "" || URL.canParse(value), "请输入有效的图片 URL"),
    coverImagePosition: z.object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    }),
    previewVideo: z
      .object({
        autoplay: z.boolean(),
        loop: z.boolean(),
        muted: z.boolean(),
        posterUrl: z
          .string()
          .trim()
          .max(4096, "视频封面 URL 不能超过 4096 个字符")
          .refine((value) => {
            if (value === "") {
              return true
            }

            if (!URL.canParse(value)) {
              return false
            }

            const protocol = new URL(value).protocol
            return protocol === "http:" || protocol === "https:" || protocol === "blob:"
          }, "请输入有效的视频封面 URL"),
        url: z
          .string()
          .trim()
          .max(4096, "视频 URL 不能超过 4096 个字符")
          .refine((value) => {
            if (value === "") {
              return true
            }

            if (!URL.canParse(value)) {
              return false
            }

            const protocol = new URL(value).protocol
            return protocol === "http:" || protocol === "https:" || protocol === "blob:"
          }, "请输入有效的 HTTP(S) 视频 URL"),
      })
      .superRefine((video, context) => {
        if (video.autoplay && !video.muted) {
          context.addIssue({
            code: "custom",
            message: "自动播放视频必须静音",
            path: ["muted"],
          })
        }
      }),
    themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "请选择有效的主题色"),
    template: z.enum(campaignTemplateValues),
    motion: z.enum(["cascade", "drift", "kinetic", "parallax", "pulse", "scan"]),
    motionSettings: z.object({
      ambient: z.boolean(),
      entrance: z.boolean(),
      intensity: z.enum(["subtle", "balanced", "bold"]),
      parallax: z.boolean(),
      scrollReveal: z.boolean(),
      speed: z.number().min(0.6, "动效速度不能低于 0.6 倍").max(1.8, "动效速度不能高于 1.8 倍"),
    }),
    questionnaire: campaignQuestionnaireSchema,
    pageContent: campaignPageContentSchema,
    sectionVisibility: z.object({
      hero: z.boolean(),
      video: z.boolean(),
      highlights: z.boolean(),
      slogan: z.boolean(),
      timeline: z.boolean(),
      signup: z.boolean(),
    }),
    sectionOrder: z
      .array(z.enum(campaignBodySectionValues))
      .length(campaignBodySectionValues.length)
      .refine((sections) => new Set(sections).size === campaignBodySectionValues.length, {
        message: "页面区域顺序无效",
      }),
    header: z.object({
      enabled: z.boolean(),
      brandLabel: z
        .string()
        .trim()
        .min(1, "Header 品牌名称不能为空")
        .max(24, "Header 品牌名称不能超过 24 个字符"),
      metaLabel: z.string().trim().max(24, "Header 右侧标识不能超过 24 个字符"),
      showSlogan: z.boolean(),
    }),
    marquee: z.object({
      content: z
        .string()
        .trim()
        .min(1, "滚动标语内容不能为空")
        .max(160, "滚动标语不能超过 160 个字符"),
      infinite: z.boolean(),
      speed: z
        .number()
        .int("轮播速度必须为整数")
        .min(8, "轮播速度不能少于 8 秒")
        .max(60, "轮播速度不能超过 60 秒"),
    }),
    countdown: campaignCountdownSchema,
    intent: z.enum(["draft", "publish"]),
  })
  .superRefine((config, context) => {
    if (!isMotionAvailableForTemplate(config.template, config.motion)) {
      context.addIssue({
        code: "custom",
        message: "当前模板不支持该页面动效",
        path: ["motion"],
      })
    }
  })

export type CampaignConfigInput = z.infer<typeof campaignConfigSchema>

export interface ActionState {
  status: "idle" | "success" | "error"
  message: string
  version?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
}

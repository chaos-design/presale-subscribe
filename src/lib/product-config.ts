export const productConfig = {
  name: "REPS",
  fullName: "Release, Email-capture, Preview & Subscription",
  wordmark: "REPS",
  stages: ["Release", "Email-capture", "Preview", "Subscription"],
  slogan: "Every release, a way in.",
  // 供分享图与站点元信息使用的英文描述；中文描述保留在 tagline。
  description: "Prescribe the release. Capture the demand.",
  tagline: "把功能预告做成一条可以追踪的发布链路",
  homePath: "/",
  // REPS 产品自身署名；项目文案仍来自 CampaignConfig。
  productCredit: {
    label: "MADE WITH REPS",
    description: "开源功能预告与预约订阅系统",
    year: "2026",
    githubUrl: "https://github.com/chaos-design/presale-subscribe",
  },
} as const

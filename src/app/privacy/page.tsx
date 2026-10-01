import type { Metadata } from "next"

import { LegalDocumentPage, type LegalSection } from "@/components/legal-document-page"

export const metadata: Metadata = {
  title: "隐私政策",
  description: "Ahead 隐私政策。",
}

const sections: readonly LegalSection[] = [
  {
    id: "scope",
    title: "适用范围",
    paragraphs: [
      "本政策说明 Ahead 默认开源实现如何处理账号、活动内容和预约邮箱。第三方部署方应根据其实际地区、基础设施和业务用途提供补充说明。",
    ],
  },
  {
    id: "collection",
    title: "我们处理的信息",
    items: [
      "账号信息：登录邮箱、Supabase Auth 用户标识、邮箱确认状态和会话信息。",
      "活动内容：项目名称、页面文案、图片地址、视觉设置、草稿和发布快照。",
      "预约信息：公开访问者主动提交的邮箱、所属活动和提交时间。",
      "访问统计：公开页面的访问时间、有效停留时长、最大滚动深度、交互次数、来源域名、UTM 参数、设备分类、浏览器语言、时区，以及经过单向散列处理的访客和会话标识。",
      "粗粒度地域：优先读取部署平台根据请求网络提供的国家/地区/城市；字段缺失时，服务端会将访客 IP 临时发送给 IP 地理服务，仅将国家、地区和城市写入业务表。Ahead 不请求浏览器精确定位权限，也不保存原始 IP 地址。",
      "必要日志：请求时间、接口结果和用于安全、排障的技术记录。",
    ],
  },
  {
    id: "purpose",
    title: "处理目的",
    items: [
      "验证身份、保护工作台并隔离不同所有者的数据。",
      "保存草稿、生成公开页面并维护不可变发布快照。",
      "接收预约、展示订阅者列表并提供 CSV 导出。",
      "统计公开页面的 PV、UV、来源、设备、粗粒度地域、参与行为和申请转化，帮助项目所有者分析发布效果。",
      "预防滥用、排查故障并履行适用法律义务。",
    ],
  },
  {
    id: "storage",
    title: "存储与安全",
    paragraphs: [
      "账号与业务数据存储于部署方配置的 Supabase。密码由 Supabase Auth 处理，Ahead 业务表不保存明文密码。",
      "系统通过服务端身份复核、行级安全策略和受限公开 RPC 控制访问。匿名访问者不能直接读取活动表或订阅者表。",
    ],
  },
  {
    id: "public-pages",
    title: "公开页面",
    paragraphs: [
      "只有处于已发布状态的快照会通过公开链接展示。公开页面不读取草稿，也不公开订阅者名单。",
      "访问者提交邮箱前应了解对应活动的通知用途；项目所有者应仅将邮箱用于该活动相关通知。",
      "访问统计不保存 IP 地址、原始 User-Agent 或精确位置。访客与会话随机标识会在写入数据库前进行 SHA-256 散列，并仅用于去重统计和把预约与其匿名访问行为关联。",
    ],
  },
  {
    id: "providers",
    title: "第三方服务",
    paragraphs: [
      "默认部署可以使用 Supabase 提供认证与数据库，使用 Vercel 或其他 Next.js 兼容平台托管应用，并在平台地域字段缺失时使用 IPWhois.io 补全粗粒度地域。活动图片由项目所有者配置的地址提供。",
      "这些服务商依据各自条款处理必要信息，第三方部署方应披露其实际使用的服务商和部署地区。",
    ],
  },
  {
    id: "retention",
    title: "保留、删除与导出",
    paragraphs: [
      "活动、访问统计和预约数据通常保留至项目所有者删除对应活动，或部署方因服务终止、违规处理或法律义务进行清理。",
      "工作台支持删除活动和单个订阅者，并允许项目所有者导出其活动下的预约邮箱。",
    ],
  },
  {
    id: "cookies",
    title: "Cookie 与本地状态",
    paragraphs: [
      "系统使用必要 Cookie 维持 Supabase 登录会话，并可能保存界面主题等本地偏好。公开页面使用本地随机标识计算去重访客，不依赖广告追踪 Cookie；浏览器开启 Do Not Track 时不会上报访问统计。",
    ],
  },
  {
    id: "changes",
    title: "政策更新与联系",
    paragraphs: [
      "我们可能根据产品能力、服务商或法律要求更新本政策，并通过本页面更新生效日期。",
      "如需提出隐私或安全问题，请通过项目公开仓库或当前部署方公布的联系方式反馈。请勿在公开问题中提交密码、验证码或完整订阅者名单。",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      documentType="privacy"
      eyebrow="LEGAL / PRIVACY"
      title="隐私政策"
      summary="这份政策说明 Ahead 在账号认证、活动发布和公开预约过程中如何处理信息。"
      sections={sections}
    />
  )
}

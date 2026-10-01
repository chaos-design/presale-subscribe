import type { Metadata } from "next"

import { LegalDocumentPage, type LegalSection } from "@/components/legal-document-page"

export const metadata: Metadata = {
  title: "服务条款",
  description: "Ahead 服务条款。",
}

const sections: readonly LegalSection[] = [
  {
    id: "acceptance",
    title: "接受与适用",
    paragraphs: [
      "当你注册、登录、访问或使用 Ahead 时，即表示你已阅读、理解并同意本条款。若你不同意其中任何内容，请停止使用本服务。",
      "第三方部署方可以根据其实际服务补充条款；依法有效的补充条款由该部署方负责说明。",
    ],
  },
  {
    id: "service",
    title: "服务内容",
    paragraphs: [
      "Ahead 提供功能预告页面创建、草稿编辑、发布快照、公开预约和订阅者管理能力。具体能力以你实际访问的版本为准。",
      "我们可能出于安全、合规、维护或产品演进需要调整、暂停或终止部分功能。",
    ],
  },
  {
    id: "account",
    title: "账号与安全",
    items: [
      "使用本人可控制的邮箱注册并完成邮箱确认。",
      "妥善保管密码、验证码和登录设备，不得允许他人冒用账号。",
      "发现未经授权的使用时，应立即修改密码并联系当前部署方。",
    ],
  },
  {
    id: "content",
    title: "活动内容与授权",
    paragraphs: [
      "你保留对活动文案、图片和品牌内容依法享有的权利，并确认有权发布这些内容。",
      "为提供保存、渲染、发布和分享功能，你允许当前部署方在服务必要范围内处理这些内容。",
    ],
  },
  {
    id: "publishing",
    title: "发布与公开预约",
    paragraphs: [
      "主动发布会生成公开快照，持有链接的访问者无需登录即可查看并提交邮箱。草稿修改不会自动改变已发布快照。",
      "你应在发布前检查页面内容，并妥善管理通过活动收集的订阅邮箱。",
    ],
  },
  {
    id: "acceptable-use",
    title: "使用规范",
    items: [
      "不得发布违法、侵权、欺诈、恶意或误导性内容。",
      "不得绕过认证、权限校验、速率限制或访问他人的活动与订阅数据。",
      "不得利用公开预约能力发送垃圾信息或收集与活动无关的个人信息。",
    ],
  },
  {
    id: "availability",
    title: "可用性与责任边界",
    paragraphs: [
      "我们会采取合理措施维护服务与数据安全，但不保证服务永不中断、完全无错误或满足所有特定用途。",
      "你应自行保留重要活动内容与订阅者导出文件的必要备份。",
    ],
  },
  {
    id: "changes",
    title: "条款更新与联系",
    paragraphs: [
      "我们可能根据功能、法律或安全要求更新本条款，并通过本页面更新生效日期。",
      "对本条款有疑问时，请通过项目公开仓库或当前部署方公布的联系方式反馈。",
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalDocumentPage
      documentType="terms"
      eyebrow="LEGAL / TERMS"
      title="服务条款"
      summary="这份条款说明你在使用 Ahead 创建、发布和管理功能预告时的权利、责任与使用边界。"
      sections={sections}
    />
  )
}

import { getCampaignTemplateScheme } from "@/lib/campaign-template-schemes"
import type {
  CampaignBodySection,
  CampaignConfig,
  CampaignCountdownConfig,
  CampaignHeaderConfig,
  CampaignImagePosition,
  CampaignMarqueeConfig,
  CampaignMotion,
  CampaignMotionSettings,
  CampaignPageContent,
  CampaignPreviewVideo,
  CampaignQuestion,
  CampaignQuestionnaire,
  CampaignQuestionType,
  CampaignSectionVisibility,
  CampaignTemplate,
} from "@/types/database"
import { campaignBodySectionValues } from "@/types/database"

function normalizeCoverImage(value: string | undefined) {
  return value ?? ""
}

export const templateOptions: Array<{
  value: CampaignTemplate
  label: string
  description: string
  code: string
  category: "品牌叙事" | "产品发布" | "实验视觉" | "专业服务"
}> = [
  {
    value: "launch",
    label: "轨道首发",
    description: "沉浸影像与超大标题",
    code: "LCH-01",
    category: "产品发布",
  },
  {
    value: "editorial",
    label: "未来档案",
    description: "明亮留白与杂志秩序",
    code: "ARC-02",
    category: "品牌叙事",
  },
  {
    value: "signal",
    label: "信号终端",
    description: "高密度数据与终端语言",
    code: "SIG-03",
    category: "产品发布",
  },
  {
    value: "orbit",
    label: "深空轨道",
    description: "环形坐标与影院构图",
    code: "ORB-04",
    category: "品牌叙事",
  },
  {
    value: "prism",
    label: "光谱界面",
    description: "透亮图层与色彩切片",
    code: "PRM-05",
    category: "实验视觉",
  },
  {
    value: "monolith",
    label: "核心舱",
    description: "工业框架与强势聚焦",
    code: "MNL-06",
    category: "产品发布",
  },
  {
    value: "atelier",
    label: "瑞士工坊",
    description: "国际主义网格与印刷张力",
    code: "ATL-07",
    category: "专业服务",
  },
  {
    value: "nocturne",
    label: "午夜首映",
    description: "电影片头与夜色奢华",
    code: "NCT-08",
    category: "品牌叙事",
  },
  {
    value: "kinetic",
    label: "动态宣言",
    description: "超大文字与运动海报",
    code: "KNT-09",
    category: "实验视觉",
  },
  {
    value: "broadsheet",
    label: "晨间头版",
    description: "报刊版式与编辑现场感",
    code: "NWS-10",
    category: "品牌叙事",
  },
  {
    value: "playground",
    label: "彩色游乐场",
    description: "原色积木与轻快节奏",
    code: "PLY-11",
    category: "实验视觉",
  },
  {
    value: "ledger",
    label: "登机票据",
    description: "票券编号与精密信息层",
    code: "LDG-12",
    category: "专业服务",
  },
  {
    value: "terrain",
    label: "地形图谱",
    description: "等高线切片与自然科技",
    code: "TRN-13",
    category: "产品发布",
  },
  {
    value: "broadcast",
    label: "声场电台",
    description: "广播刻度与声波节拍",
    code: "AIR-14",
    category: "品牌叙事",
  },
  {
    value: "catalog",
    label: "银幕目录",
    description: "高对比目录与展陈秩序",
    code: "CAT-15",
    category: "专业服务",
  },
  {
    value: "biolab",
    label: "生物实验室",
    description: "有机结构与实验记录",
    code: "BIO-16",
    category: "实验视觉",
  },
]

export const themeOptions = [
  { value: "#FF5B36", label: "推进橙", family: "高饱和" },
  { value: "#00D4C8", label: "离子青", family: "高饱和" },
  { value: "#3B6CFF", label: "国际蓝", family: "高饱和" },
  { value: "#C6FF3E", label: "酸性绿", family: "高饱和" },
  { value: "#FFCC33", label: "信标黄", family: "高饱和" },
  { value: "#FF3D6E", label: "脉冲红", family: "高饱和" },
  { value: "#A884FF", label: "电气紫", family: "高饱和" },
  { value: "#65D1FF", label: "冰川蓝", family: "高饱和" },
  { value: "#E33D26", label: "海报朱红", family: "编辑色" },
  { value: "#167D70", label: "档案绿", family: "编辑色" },
  { value: "#B33A3A", label: "酒渍红", family: "编辑色" },
  { value: "#F2A7C2", label: "摄影粉", family: "编辑色" },
  { value: "#D8C4A8", label: "陶土灰", family: "中性色" },
  { value: "#F2F4EE", label: "月面白", family: "中性色" },
  { value: "#6E7BFF", label: "群青", family: "中性色" },
  { value: "#111111", label: "油墨黑", family: "中性色" },
]

export const motionOptions: Array<{
  value: CampaignMotion
  label: string
  description: string
  code: string
}> = [
  {
    value: "cascade",
    label: "分层揭幕",
    description: "内容沿层级依次显现并回落",
    code: "CASCADE",
  },
  {
    value: "drift",
    label: "缓慢漂移",
    description: "长周期位移，安静而有纵深",
    code: "DRIFT",
  },
  {
    value: "scan",
    label: "信号扫描",
    description: "扫描线与数据刷新节奏",
    code: "SCAN",
  },
  {
    value: "pulse",
    label: "呼吸脉冲",
    description: "聚焦框缓慢扩散并回落",
    code: "PULSE",
  },
  {
    value: "kinetic",
    label: "动态切片",
    description: "更有张力的错位与切入",
    code: "KINETIC",
  },
  {
    value: "parallax",
    label: "景深视差",
    description: "前后景以不同速度缓慢游移",
    code: "PARALLAX",
  },
]

const motionValuesByTemplate: Record<CampaignTemplate, CampaignMotion[]> = {
  launch: ["scan", "pulse", "drift", "parallax", "cascade"],
  broadsheet: ["drift", "kinetic", "cascade", "scan"],
  editorial: ["drift", "scan", "cascade", "parallax"],
  signal: ["scan", "pulse", "kinetic", "cascade", "parallax"],
  orbit: ["drift", "pulse", "parallax", "cascade"],
  prism: ["kinetic", "drift", "parallax", "pulse"],
  monolith: ["pulse", "scan", "cascade", "kinetic"],
  atelier: ["kinetic", "drift", "cascade", "scan"],
  nocturne: ["drift", "pulse", "parallax", "cascade", "kinetic"],
  kinetic: ["kinetic", "scan", "pulse", "cascade"],
  playground: ["kinetic", "pulse", "parallax", "cascade"],
  ledger: ["scan", "drift", "cascade", "kinetic"],
  terrain: ["drift", "pulse", "parallax", "cascade"],
  broadcast: ["scan", "pulse", "cascade", "kinetic"],
  catalog: ["drift", "cascade", "scan", "parallax"],
  biolab: ["parallax", "pulse", "drift", "cascade", "scan"],
}

export function getMotionOptionsForTemplate(template: CampaignTemplate) {
  const supportedValues = motionValuesByTemplate[template]
  return motionOptions.filter((option) => supportedValues.includes(option.value))
}

export function isMotionAvailableForTemplate(template: CampaignTemplate, motion: CampaignMotion) {
  return motionValuesByTemplate[template].includes(motion)
}

export const defaultCampaignQuestionnaire: CampaignQuestionnaire = {
  enabled: true,
  title: "在抵达之前，留下你的坐标",
  description: "三道轻量问题，帮助我们把第一批体验交给真正需要它的人。",
  questions: [
    {
      id: "first-signal",
      label: "你最想先看到哪一部分？",
      type: "single_choice",
      required: true,
      placeholder: "",
      options: ["协作流程", "自动化能力", "发布控制"],
    },
    {
      id: "priority-signals",
      label: "哪些信息会帮助你判断是否加入首批体验？",
      type: "multiple_choice",
      required: false,
      placeholder: "",
      options: ["开放时间", "功能范围", "价格计划", "迁移方式"],
    },
    {
      id: "one-more-thing",
      label: "还有什么，会让这次更新对你更有价值？",
      type: "short_text",
      required: false,
      placeholder: "写下一句期待，或一个正在卡住你的问题",
      options: [],
    },
  ],
}

export const defaultCampaignSectionVisibility: CampaignSectionVisibility = {
  hero: true,
  video: true,
  highlights: true,
  slogan: true,
  timeline: true,
  signup: true,
}

export const defaultCampaignMotionSettings: CampaignMotionSettings = {
  ambient: true,
  entrance: true,
  intensity: "balanced",
  parallax: true,
  scrollReveal: true,
  speed: 1,
}

export const defaultCampaignPreviewVideo: CampaignPreviewVideo = {
  autoplay: false,
  loop: false,
  muted: true,
  posterUrl: "",
  url: "",
}

export const defaultCampaignCountdown: CampaignCountdownConfig = {
  completeLabel: "预约窗口已开启",
  enabled: false,
  label: "距离开放还剩",
  targetAt: "",
}

export const defaultCampaignImagePosition: CampaignImagePosition = {
  x: 50,
  y: 50,
}

const pageContentByTemplate: Record<CampaignTemplate, CampaignPageContent> = {
  launch: {
    sectionEyebrow: "THE RELEASE, UNFOLDED",
    highlights: [
      {
        label: "01 / FLOW",
        title: "更短的协作路径",
        description: "把分散的确认、反馈和发布动作收束到一条清晰路径中。",
      },
      {
        label: "02 / CONTROL",
        title: "稳定的线上版本",
        description: "草稿持续迭代，已发布内容保持稳定，直到下一次主动更新。",
      },
      {
        label: "03 / SIGNAL",
        title: "真实的需求信号",
        description: "预约与问卷集中归档，让首批开放更接近真正需要它的人。",
      },
    ],
    timelineTitle: "从预告到开放，每一步都有明确状态",
    timelineDescription:
      "页面不只承载一句预告，而是完整说明正在发生什么、何时发生，以及访客接下来会收到什么。",
    milestones: [
      { label: "NOW", title: "公开预告", description: "发布完整背景、能力范围与预约入口。" },
      { label: "NEXT", title: "邀请首批用户", description: "根据真实需求分批发送开放通知。" },
      { label: "THEN", title: "持续更新", description: "在同一地址发布下一阶段稳定快照。" },
    ],
    closingTitle: "在正式开放之前，先进入首批通知名单。",
    closingDescription: "留下邮箱与几条真实需求。我们只会发送与这次发布直接相关的更新。",
  },
  editorial: {
    sectionEyebrow: "ARCHIVE / CHAPTERS",
    highlights: [
      {
        label: "CHAPTER 01",
        title: "想法从哪里开始",
        description: "记录问题背景、判断依据与这次更新真正想改变的体验。",
      },
      {
        label: "CHAPTER 02",
        title: "正在认真打磨的部分",
        description: "公开关键设计取舍，让等待拥有足够具体的理由。",
      },
      {
        label: "CHAPTER 03",
        title: "抵达后的新日常",
        description: "描述更新如何进入真实工作，而不是只列出一组功能名称。",
      },
    ],
    timelineTitle: "一本持续更新的发布档案",
    timelineDescription: "以编辑章节组织产品进展，保留从概念、试验到正式开放的完整脉络。",
    milestones: [
      { label: "FIELD NOTE 01", title: "概念成形", description: "确认读者、问题与叙事主线。" },
      { label: "FIELD NOTE 02", title: "小范围校对", description: "与首批用户验证信息和体验。" },
      { label: "FIELD NOTE 03", title: "正式刊发", description: "发布稳定版本与后续来信。" },
    ],
    closingTitle: "订阅这份发布档案的下一页。",
    closingDescription: "当新的章节完成，我们会把最重要的变化整理成一封克制的来信。",
  },
  signal: {
    sectionEyebrow: "CHANNEL / CAPABILITIES",
    highlights: [
      {
        label: "ENDPOINT_01",
        title: "更稳定的接口契约",
        description: "核心路径提供清晰版本边界、错误说明与可追踪状态。",
      },
      {
        label: "ENDPOINT_02",
        title: "更快的接入反馈",
        description: "从文档、测试额度到迁移建议，缩短第一次成功调用的距离。",
      },
      {
        label: "ENDPOINT_03",
        title: "可控的开放批次",
        description: "根据技术场景与规模逐步开放，保证每一批反馈都能被处理。",
      },
    ],
    timelineTitle: "Private beta transmission protocol",
    timelineDescription: "每个开放阶段都对应明确输入、验证范围和下一步反馈，不制造无效等待。",
    milestones: [
      { label: "STATUS / 200", title: "登记场景", description: "提交团队规模、技术栈与优先需求。" },
      { label: "STATUS / 202", title: "进入队列", description: "完成适配评估并分配测试批次。" },
      { label: "STATUS / 204", title: "开放通道", description: "发送 SDK、文档与测试额度。" },
    ],
    closingTitle: "Request access to the private channel.",
    closingDescription: "留下技术场景和邮箱。通道准备好后，我们会发送一次准确通知。",
  },
  orbit: {
    sectionEyebrow: "MISSION / SYSTEMS",
    highlights: [
      {
        label: "VECTOR 01",
        title: "重新校准关键路径",
        description: "减少往返切换，让每一个决定都更接近最终发布。",
      },
      {
        label: "VECTOR 02",
        title: "保持版本在轨",
        description: "将草稿探索与线上稳定状态分开，避免无意改变公开内容。",
      },
      {
        label: "VECTOR 03",
        title: "捕获真实信号",
        description: "通过轻量问卷理解访客期待，为首批开放建立优先级。",
      },
    ],
    timelineTitle: "一次克制而完整的轨道转移",
    timelineDescription: "从锁定窗口到进入稳定轨道，每个阶段都围绕可靠性和可理解性展开。",
    milestones: [
      { label: "T-30", title: "锁定任务范围", description: "确认核心能力与首批适用场景。" },
      { label: "T-07", title: "完成窗口检查", description: "验证内容、性能与发布边界。" },
      { label: "T+00", title: "进入新轨道", description: "向预约用户开放稳定版本。" },
    ],
    closingTitle: "加入这次发射的优先通信名单。",
    closingDescription: "我们会在窗口开启时发送坐标、开放范围和下一步说明。",
  },
  prism: {
    sectionEyebrow: "SPECTRUM / LAYERS",
    highlights: [
      {
        label: "LAYER 01",
        title: "信息层级更清晰",
        description: "重要内容、状态和动作在第一眼就能被准确识别。",
      },
      {
        label: "LAYER 02",
        title: "反馈更接近操作",
        description: "每次切换与提交都立即给出可理解的结果和下一步。",
      },
      {
        label: "LAYER 03",
        title: "复杂度被重新折叠",
        description: "减少重复确认，把更多注意力留给真正需要判断的内容。",
      },
    ],
    timelineTitle: "从模糊界面到清晰光谱",
    timelineDescription: "新版按真实任务重新组织界面，让每个层级都承担明确职责。",
    milestones: [
      { label: "REFRACT", title: "拆分问题", description: "识别高频阻塞与重复动作。" },
      { label: "FOCUS", title: "重组界面", description: "建立更清晰的状态和路径。" },
      { label: "REVEAL", title: "开放新版", description: "按批次验证并持续调整。" },
    ],
    closingTitle: "先看到下一版界面的完整光谱。",
    closingDescription: "加入预约名单，获取开放提醒、能力说明与首批体验入口。",
  },
  monolith: {
    sectionEyebrow: "CORE / MODULES",
    highlights: [
      {
        label: "MODULE A",
        title: "统一配置入口",
        description: "关键设置、版本状态与受众反馈集中在一个可控界面。",
      },
      {
        label: "MODULE B",
        title: "明确发布边界",
        description: "每次上线都生成稳定快照，避免草稿变化穿透到线上。",
      },
      {
        label: "MODULE C",
        title: "完整数据归属",
        description: "项目、预约和问卷回答保持清晰关联，便于持续运营。",
      },
    ],
    timelineTitle: "核心能力按模块逐步解锁",
    timelineDescription: "先建立可靠基座，再开放自动化与扩展能力，确保复杂系统保持可控。",
    milestones: [
      { label: "CORE / 01", title: "稳定基座", description: "完成配置、权限与版本边界。" },
      { label: "CORE / 02", title: "工作流接入", description: "开放团队协作与自动化触点。" },
      { label: "CORE / 03", title: "规模化运行", description: "提供数据洞察与扩展能力。" },
    ],
    closingTitle: "锁定核心系统的首批访问席位。",
    closingDescription: "告诉我们当前工作流最重的一步，开放时将优先匹配适用团队。",
  },
  atelier: {
    sectionEyebrow: "SYSTEM / PRINCIPLES",
    highlights: [
      {
        label: "01 / GRID",
        title: "清楚胜过装饰",
        description: "以可靠网格建立阅读顺序，让信息自然成为页面主角。",
      },
      {
        label: "02 / TYPE",
        title: "层级承担表达",
        description: "通过尺度、密度和节奏区分背景、重点与行动。",
      },
      {
        label: "03 / SPACE",
        title: "留白保留判断",
        description: "避免无效拥挤，让访客有足够空间理解这次发布。",
      },
    ],
    timelineTitle: "从编辑框架到正式版本",
    timelineDescription: "把发布视为一套持续维护的视觉系统，而不是一次性的宣传页面。",
    milestones: [
      { label: "PROOF 01", title: "建立秩序", description: "确认信息层级与响应式网格。" },
      { label: "PROOF 02", title: "校准细节", description: "验证内容密度与关键动作。" },
      { label: "EDITION 01", title: "正式发布", description: "输出稳定页面并开始收集预约。" },
    ],
    closingTitle: "为这次发布保留一个明确席位。",
    closingDescription: "加入名单，在正式版本完成时收到一封包含全部关键信息的通知。",
  },
  nocturne: {
    sectionEyebrow: "PREMIERE / ACTS",
    highlights: [
      {
        label: "ACT I",
        title: "揭开创作背景",
        description: "从最初动机开始，让观众理解这次发布为何值得等待。",
      },
      {
        label: "ACT II",
        title: "公开首批片段",
        description: "展示足够具体的内容与体验，而不是只留下悬念。",
      },
      {
        label: "ACT III",
        title: "保留首映席位",
        description: "为真正感兴趣的人提供明确、克制且可预期的入口。",
      },
    ],
    timelineTitle: "A private premiere in three acts",
    timelineDescription: "让预告、幕后与首映形成完整节奏，每个阶段都提供新的真实内容。",
    milestones: [
      { label: "ACT / 01", title: "幕后公开", description: "发布创作背景与第一组细节。" },
      { label: "ACT / 02", title: "限定试映", description: "邀请小范围观众参与反馈。" },
      { label: "ACT / 03", title: "正式首映", description: "向预约名单开放完整体验。" },
    ],
    closingTitle: "Reserve a seat before the curtain rises.",
    closingDescription: "留下邮箱，在首映窗口确认后获得完整邀请与幕后更新。",
  },
  kinetic: {
    sectionEyebrow: "MOVE / CHANGE / SIGNAL",
    highlights: [
      {
        label: "MOVE 01",
        title: "把变化放到最前面",
        description: "直接说明这次更新改变了什么，以及为什么现在值得行动。",
      },
      {
        label: "MOVE 02",
        title: "让节奏推动阅读",
        description: "以高对比区块和动态反馈组织长页面，不牺牲信息完整度。",
      },
      {
        label: "MOVE 03",
        title: "让动作保持唯一",
        description: "所有内容最终指向一个清晰预约入口，减少选择成本。",
      },
    ],
    timelineTitle: "MAKE THE RELEASE MOVE",
    timelineDescription: "一套从声明、验证到开放的动态发布节奏，让每个阶段都足够鲜明。",
    milestones: [
      { label: "START", title: "发布声明", description: "公开变化、范围与核心价值。" },
      { label: "SHIFT", title: "收集反馈", description: "根据预约需求校准开放顺序。" },
      { label: "GO", title: "启动新版", description: "向首批名单发送访问入口。" },
    ],
    closingTitle: "BE FIRST TO SEE THE NEXT MOVE.",
    closingDescription: "接收一次明确的发布信号，以及真正需要知道的后续变化。",
  },
  broadsheet: {
    sectionEyebrow: "THE FULL STORY",
    highlights: [
      {
        label: "REPORT / 01",
        title: "重要变化有了标题",
        description: "用一条清晰主线概括发布价值，让读者快速进入上下文。",
      },
      {
        label: "REPORT / 02",
        title: "细节经得起阅读",
        description: "完整呈现背景、关键能力和开放方式，而不是停留在口号。",
      },
      {
        label: "REPORT / 03",
        title: "下一版持续抵达",
        description: "同一地址承载后续稳定版本，让每次更新都可被追踪。",
      },
    ],
    timelineTitle: "从头版消息到持续报道",
    timelineDescription: "用报刊式结构给新产品足够完整的版面，同时保持预约动作清晰可见。",
    milestones: [
      { label: "EARLY EDITION", title: "发布头版", description: "公开最重要的消息与背景。" },
      { label: "MIDDAY EDITION", title: "补充细节", description: "加入验证结果和开放说明。" },
      { label: "FINAL EDITION", title: "正式上线", description: "向订阅读者发送完整版本。" },
    ],
    closingTitle: "订阅下一版重要更新。",
    closingDescription: "我们会把正式开放、关键变化和访问方式整理成一封可读的来信。",
  },
  playground: {
    sectionEyebrow: "IDEAS IN PLAY",
    highlights: [
      {
        label: "BLOCK 01",
        title: "先把想法做出来",
        description: "让创意快速拥有可体验的形状，再用真实反馈继续调整。",
      },
      {
        label: "BLOCK 02",
        title: "让参与变得轻松",
        description: "用简单问题了解兴趣，不让预约流程消耗用户耐心。",
      },
      {
        label: "BLOCK 03",
        title: "让每次更新有颜色",
        description: "不同阶段保持鲜明状态，访客总能知道接下来会发生什么。",
      },
    ],
    timelineTitle: "一场从想法到开放的共同游戏",
    timelineDescription: "用轻快节奏展示创作过程，并为社区成员保留持续参与的入口。",
    milestones: [
      { label: "READY", title: "摆好积木", description: "公开概念与第一版玩法。" },
      { label: "SET", title: "邀请共创", description: "收集社区场景和真实建议。" },
      { label: "PLAY", title: "正式开场", description: "向预约成员发送入场方式。" },
    ],
    closingTitle: "拿一张首场体验的入场券。",
    closingDescription: "留下你最想尝试的部分，开场时我们会把邀请送到邮箱。",
  },
  ledger: {
    sectionEyebrow: "ACCESS / DETAILS",
    highlights: [
      {
        label: "CLASS / A",
        title: "批次清楚可查",
        description: "每一轮开放都有明确范围、资格说明与后续状态。",
      },
      {
        label: "CLASS / B",
        title: "权益准确列明",
        description: "将首批能力、支持方式和限制条件放在同一张数字票据上。",
      },
      {
        label: "CLASS / C",
        title: "入口稳定有效",
        description: "已发布页面保持不变，避免预约用户收到过期或模糊信息。",
      },
    ],
    timelineTitle: "Your route to confirmed access",
    timelineDescription: "以票券秩序组织候补、确认与开放，让限量发布仍然准确透明。",
    milestones: [
      { label: "CHECK-IN", title: "登记需求", description: "提交邮箱与适用场景。" },
      { label: "GATE OPEN", title: "确认批次", description: "发送编号、权益与开放时间。" },
      { label: "BOARDING", title: "获得访问", description: "按批次提供正式入口与支持。" },
    ],
    closingTitle: "领取你的候补编号。",
    closingDescription: "完成登记后，我们会在席位确认时发送批次、时间和访问说明。",
  },
  terrain: {
    sectionEyebrow: "FIELD / WAYPOINTS",
    highlights: [
      {
        label: "WAYPOINT 01",
        title: "看清当前地形",
        description: "先说明问题、限制和现有路径，让改变拥有可靠起点。",
      },
      {
        label: "WAYPOINT 02",
        title: "标记关键节点",
        description: "把复杂计划拆成可理解的阶段、范围与验证目标。",
      },
      {
        label: "WAYPOINT 03",
        title: "选择长期路线",
        description: "根据真实需求持续调整，而不是用一次发布结束探索。",
      },
    ],
    timelineTitle: "沿着清晰路线抵达下一阶段",
    timelineDescription: "用路线与节点呈现长期计划，让每位参与者都知道当前位置和下一个目标。",
    milestones: [
      { label: "BASE CAMP", title: "建立基线", description: "公开目标、范围与初始路线。" },
      { label: "RIDGE LINE", title: "验证路径", description: "与首批参与者测试关键节点。" },
      { label: "SUMMIT", title: "开放成果", description: "发布稳定版本与后续路线图。" },
    ],
    closingTitle: "加入下一段路线的探索名单。",
    closingDescription: "告诉我们你关注的节点，阶段开放时会收到坐标和完整说明。",
  },
  broadcast: {
    sectionEyebrow: "ON AIR / PROGRAMME",
    highlights: [
      {
        label: "CHANNEL 01",
        title: "把核心消息调到前台",
        description: "用清楚的频段与节目结构，让访客迅速听见发布重点。",
      },
      {
        label: "CHANNEL 02",
        title: "让更新保持稳定节拍",
        description: "从预告、试播到正式上线，每一阶段都有明确内容与时间。",
      },
      {
        label: "CHANNEL 03",
        title: "收集真实听众信号",
        description: "通过预约与问卷理解关注方向，为首批开放安排优先级。",
      },
    ],
    timelineTitle: "从试播信号到正式开台",
    timelineDescription: "以广播节目单组织发布过程，让每次更新都短、准、可预期。",
    milestones: [
      { label: "TEST SIGNAL", title: "发送试播", description: "公开主题、频段与首批内容。" },
      { label: "OPEN LINE", title: "接收反馈", description: "邀请听众提交需求与使用场景。" },
      { label: "ON AIR", title: "正式开台", description: "向预约名单发送完整访问入口。" },
    ],
    closingTitle: "在正式开台前，先锁定你的频道。",
    closingDescription: "留下邮箱与最想听见的内容，信号稳定后会收到准确通知。",
  },
  catalog: {
    sectionEyebrow: "INDEX / COLLECTION",
    highlights: [
      {
        label: "PLATE 01",
        title: "每项能力都有索引",
        description: "以目录式结构呈现核心功能、适用范围与开放条件。",
      },
      {
        label: "PLATE 02",
        title: "展陈秩序保持克制",
        description: "让图像、标题和说明各自承担职责，减少无效装饰。",
      },
      {
        label: "PLATE 03",
        title: "预约入口清晰可查",
        description: "访客可以快速确认批次、权益与下一步，不必反复寻找。",
      },
    ],
    timelineTitle: "一份持续更新的发布目录",
    timelineDescription: "从入藏、编目到公开展出，完整记录新版本进入市场的过程。",
    milestones: [
      { label: "ACQUIRE", title: "内容入藏", description: "确认发布范围与核心材料。" },
      { label: "INDEX", title: "完成编目", description: "校准信息层级与预约路径。" },
      { label: "EXHIBIT", title: "公开展出", description: "发布稳定页面并通知首批访客。" },
    ],
    closingTitle: "预约查看这套目录的正式版本。",
    closingDescription: "当完整版本开放时，你会收到展陈范围、访问方式与更新说明。",
  },
  biolab: {
    sectionEyebrow: "SPECIMEN / NOTES",
    highlights: [
      {
        label: "SAMPLE A",
        title: "从真实样本开始",
        description: "用具体场景验证产品假设，让每次变化都有可观察依据。",
      },
      {
        label: "SAMPLE B",
        title: "让实验过程可理解",
        description: "公开阶段目标、约束与结果，减少只有结论没有背景的发布。",
      },
      {
        label: "SAMPLE C",
        title: "把反馈写回记录",
        description: "将预约需求转化为下一轮实验输入，持续校准开放方向。",
      },
    ],
    timelineTitle: "从培养样本到稳定开放",
    timelineDescription: "用实验记录呈现产品生长过程，在每个阶段留下明确观察结果。",
    milestones: [
      { label: "CULTURE", title: "建立样本", description: "定义问题、范围与第一批变量。" },
      { label: "OBSERVE", title: "持续观察", description: "邀请目标用户验证关键体验。" },
      { label: "RELEASE", title: "稳定开放", description: "发布成熟版本与后续实验计划。" },
    ],
    closingTitle: "加入下一轮实验的观察名单。",
    closingDescription: "留下真实场景与邮箱，样本开放时会发送完整实验说明。",
  },
}

export const defaultCampaignConfig: CampaignConfig = {
  title: "下一次更新，先让你知道",
  slogan: "Every release, a way in.",
  description: "留下邮箱，在新功能开放的第一时间收到通知。没有噪音，只有重要进展。",
  featureTitle: "为真正关心更新的人准备",
  featureDescription:
    "集中展示本次发布最值得关注的能力、开放范围与时间节点，让访客在预约前获得完整信息。",
  eyebrow: "EARLY ACCESS · 2026",
  emailLabel: "留下你的邮箱",
  buttonLabel: "预约首发通知",
  successMessage: "预约成功，我们会在开放时通知你。",
  coverImage: "",
  coverImagePosition: defaultCampaignImagePosition,
  previewVideo: defaultCampaignPreviewVideo,
  themeColor: "#FF5B36",
  template: "launch",
  motion: "scan",
  motionSettings: defaultCampaignMotionSettings,
  questionnaire: defaultCampaignQuestionnaire,
  pageContent: pageContentByTemplate.launch,
  sectionVisibility: defaultCampaignSectionVisibility,
  sectionOrder: [...getCampaignTemplateScheme("launch").layout.sectionOrder],
  header: {
    enabled: true,
    brandLabel: "REPS",
    metaLabel: getCampaignTemplateScheme("launch").code,
    showSlogan: true,
  },
  marquee: {
    content: "Every release, a way in.",
    infinite: true,
    speed: 24,
  },
  countdown: defaultCampaignCountdown,
}

const campaignPresetConfigs: Record<CampaignTemplate, CampaignConfig> = {
  launch: defaultCampaignConfig,
  editorial: {
    ...defaultCampaignConfig,
    title: "值得等待的想法，正在靠近",
    slogan: "Ideas worth waiting for are getting closer.",
    description: "订阅这次发布，在产品、内容或体验正式抵达时收到第一封通知。",
    featureTitle: "一本持续更新的发布档案",
    featureDescription: "从概念、打磨到正式发布，按清晰章节呈现这次更新的背景与关键变化。",
    eyebrow: "FIELD NOTES · VOL. 08",
    buttonLabel: "订阅发布来信",
    themeColor: "#167D70",
    template: "editorial",
    motion: "drift",
  },
  signal: {
    ...defaultCampaignConfig,
    title: "Private beta channel is opening",
    slogan: "Request the signal before the channel opens.",
    description: "预约开发者内测名额，优先获取 SDK、文档、测试额度与开放时间。",
    featureTitle: "开发者通道即将开放",
    featureDescription: "首批能力包含 SDK、接口文档、测试额度与迁移建议，按批次邀请体验。",
    eyebrow: "STATUS / PRIVATE BETA",
    buttonLabel: "申请内测名额",
    themeColor: "#3B6CFF",
    template: "signal",
    motion: "scan",
  },
  orbit: {
    ...defaultCampaignConfig,
    title: "进入下一条产品轨道",
    slogan: "Hold your place in the next orbit.",
    description: "一次克制的重大更新。留下邮箱，在发射窗口开启时收到准确信号。",
    featureTitle: "稳定进入下一阶段",
    featureDescription: "围绕性能、协作与可控发布重新整理关键路径，让每次更新更容易被理解。",
    eyebrow: "ORBITAL RELEASE · 04",
    buttonLabel: "加入发射名单",
    themeColor: "#00D4C8",
    template: "orbit",
    motion: "drift",
  },
  prism: {
    ...defaultCampaignConfig,
    title: "A clearer way to see what comes next",
    slogan: "See the next release in full spectrum.",
    description: "获取新版体验的开放提醒、首批功能说明与后续更新节奏。",
    featureTitle: "更清晰的产品视图",
    featureDescription: "新版将信息层级、状态反馈和关键操作重新组织，减少切换与重复确认。",
    eyebrow: "SPECTRUM / RELEASE",
    buttonLabel: "预约新版体验",
    themeColor: "#FFCC33",
    template: "prism",
    motion: "kinetic",
  },
  monolith: {
    ...defaultCampaignConfig,
    title: "核心能力，即将解锁",
    slogan: "Unlock the core before the public release.",
    description: "为高密度发布保留一个入口，只在关键节点向你发送进展。",
    featureTitle: "把复杂能力收束到一个入口",
    featureDescription: "统一管理配置、版本和受众反馈，保留每次发布的稳定快照与明确边界。",
    eyebrow: "CORE SYSTEM · MNL-06",
    buttonLabel: "锁定首发席位",
    themeColor: "#C6FF3E",
    template: "monolith",
    motion: "pulse",
  },
  atelier: {
    ...defaultCampaignConfig,
    title: "清晰的发布，不需要更多修饰",
    slogan: "Clarity is the announcement.",
    description: "为新产品、独立刊物或限量计划建立一张结构明确的发布海报。",
    featureTitle: "内容与形式保持一致",
    featureDescription: "使用明确网格组织产品信息、开放时间和预约入口，让重点自然浮现。",
    eyebrow: "EDITION 07 / ZURICH",
    buttonLabel: "加入首发名单",
    themeColor: "#E33D26",
    template: "atelier",
    motion: "kinetic",
  },
  nocturne: {
    ...defaultCampaignConfig,
    title: "Something rare is about to begin",
    slogan: "Reserve your seat before the curtain rises.",
    description: "在正式揭幕之前，获得首映通知、幕后片段与首批开放席位。",
    featureTitle: "首映前的完整预告",
    featureDescription: "提前公开创作背景、首批内容和开放计划，为真正感兴趣的人保留位置。",
    eyebrow: "A PRIVATE PREMIERE · 08",
    buttonLabel: "保留首映席位",
    themeColor: "#F2A7C2",
    template: "nocturne",
    motion: "drift",
  },
  kinetic: {
    ...defaultCampaignConfig,
    title: "MAKE THE NEXT MOVE VISIBLE",
    slogan: "MAKE THE RELEASE MOVE.",
    description: "把下一次更新变成一张会运动的数字海报，在开放时发出明确信号。",
    featureTitle: "让变化本身成为内容",
    featureDescription: "用高对比排版和动态节奏突出新能力、发布时间与唯一预约动作。",
    eyebrow: "NEW MOTION / ISSUE 09",
    buttonLabel: "接收发布信号",
    themeColor: "#3B6CFF",
    template: "kinetic",
    motion: "kinetic",
  },
  broadsheet: {
    ...defaultCampaignConfig,
    title: "今天，下一件重要的事有了标题",
    slogan: "The next important thing has a headline.",
    description: "以一张数字头版发布新产品、独立刊物或值得被认真阅读的更新。",
    featureTitle: "让信息像新闻一样清楚",
    featureDescription: "主标题、导语与预约入口遵循报刊层级，让访客快速理解这次发布为何重要。",
    eyebrow: "THE MORNING EDITION · NO. 10",
    buttonLabel: "订阅下一版",
    themeColor: "#B33A3A",
    template: "broadsheet",
    motion: "drift",
  },
  playground: {
    ...defaultCampaignConfig,
    title: "新鲜想法，准备开场",
    slogan: "Ideas in play, invitations in motion.",
    description: "适合创意工具、社区活动和轻量产品，用鲜明原色把期待变成一次邀请。",
    featureTitle: "每个重点都有自己的颜色",
    featureDescription: "用清晰色块组织亮点、开放信息与预约动作，轻快但不牺牲可读性。",
    eyebrow: "PLAY MODE · ISSUE 11",
    buttonLabel: "拿一张入场券",
    themeColor: "#FF3D6E",
    template: "playground",
    motion: "kinetic",
  },
  ledger: {
    ...defaultCampaignConfig,
    title: "Your access is cleared for departure",
    slogan: "Your access is queued for boarding.",
    description: "把私测资格、限量名额或专业服务发布成一张信息准确的数字票券。",
    featureTitle: "每一个席位都有明确编号",
    featureDescription: "以票券结构呈现批次、权益与预约入口，适合需要秩序感的限量开放。",
    eyebrow: "BOARDING GROUP · A12",
    buttonLabel: "领取候补编号",
    themeColor: "#3B6CFF",
    template: "ledger",
    motion: "scan",
  },
  terrain: {
    ...defaultCampaignConfig,
    title: "沿着新的路径，抵达下一阶段",
    slogan: "Follow the route to what opens next.",
    description: "为可持续产品、户外品牌与长期计划建立一张兼具自然感和技术感的预告页。",
    featureTitle: "路线、节点与开放范围一目了然",
    featureDescription: "用地形切片和坐标秩序承载产品信息，让复杂计划保持轻盈和方向感。",
    eyebrow: "FIELD STATION · TRN-13",
    buttonLabel: "加入探索名单",
    themeColor: "#C6FF3E",
    template: "terrain",
    motion: "drift",
  },
  broadcast: {
    ...defaultCampaignConfig,
    title: "下一段信号，即将开始广播",
    slogan: "Tune in before the signal goes live.",
    description: "适合音频产品、内容栏目与社区发布，用广播秩序建立清晰期待。",
    featureTitle: "每一条重要信息都有自己的频段",
    featureDescription: "以节目单、频道与声波节奏组织内容，让发布过程准确而有记忆点。",
    eyebrow: "ON AIR · CHANNEL 14",
    buttonLabel: "锁定收听频道",
    themeColor: "#00D4C8",
    template: "broadcast",
    motion: "cascade",
  },
  catalog: {
    ...defaultCampaignConfig,
    title: "新作品，正在进入正式目录",
    slogan: "A precise index for what opens next.",
    description: "为设计产品、专业服务与限量系列建立一份高对比数字目录。",
    featureTitle: "用展陈秩序说明完整发布内容",
    featureDescription: "将核心能力、版本范围与预约入口整理为可快速浏览的结构化目录。",
    eyebrow: "COLLECTION · INDEX 15",
    buttonLabel: "预约目录开放",
    themeColor: "#E33D26",
    template: "catalog",
    motion: "cascade",
  },
  biolab: {
    ...defaultCampaignConfig,
    title: "新的形态，正在实验中生长",
    slogan: "Observe the next form as it evolves.",
    description: "适合健康科技、材料创新与研究型产品，记录从样本到开放的完整过程。",
    featureTitle: "让实验、观察与结果保持连续",
    featureDescription: "以有机结构承载技术信息，把真实样本和验证阶段放在视觉中心。",
    eyebrow: "BIO LAB · SAMPLE 16",
    buttonLabel: "加入观察名单",
    themeColor: "#FF5B36",
    template: "biolab",
    motion: "parallax",
  },
}

export function createCampaignConfig(template: CampaignTemplate): CampaignConfig {
  const config = campaignPresetConfigs[template]
  const scheme = getCampaignTemplateScheme(template)

  return {
    ...config,
    coverImage: config.coverImage,
    coverImagePosition: { ...config.coverImagePosition },
    previewVideo: { ...config.previewVideo },
    motionSettings: { ...config.motionSettings },
    questionnaire: {
      ...config.questionnaire,
      questions: config.questionnaire.questions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    },
    pageContent: clonePageContent(pageContentByTemplate[template]),
    sectionVisibility: { ...config.sectionVisibility },
    sectionOrder: [...scheme.layout.sectionOrder],
    header: {
      ...config.header,
      metaLabel: scheme.code,
    },
    marquee: {
      ...config.marquee,
      content: config.slogan,
    },
    countdown: { ...config.countdown },
  }
}

export function getThemeForeground(color: string) {
  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)
  const perceivedLightness = (red * 299 + green * 587 + blue * 114) / 1000

  return perceivedLightness >= 160 ? "#11110F" : "#FFFFFF"
}

export function normalizeCampaignConfig(
  value: Partial<CampaignConfig> | null | undefined
): CampaignConfig {
  const template =
    value?.template && templateOptions.some((option) => option.value === value.template)
      ? value.template
      : defaultCampaignConfig.template
  const motion =
    value?.motion && isMotionAvailableForTemplate(template, value.motion)
      ? value.motion
      : createCampaignConfig(template).motion
  const preset = createCampaignConfig(template)

  return {
    ...preset,
    ...value,
    slogan: typeof value?.slogan === "string" ? value.slogan : preset.slogan,
    emailLabel:
      typeof value?.emailLabel === "string" && value.emailLabel.trim()
        ? value.emailLabel
        : preset.emailLabel,
    coverImage: normalizeCoverImage(value?.coverImage ?? preset.coverImage),
    coverImagePosition: normalizeImagePosition(value?.coverImagePosition),
    previewVideo: normalizePreviewVideo(value?.previewVideo),
    template,
    motion,
    motionSettings: normalizeMotionSettings(value?.motionSettings),
    questionnaire: normalizeQuestionnaire(value?.questionnaire),
    pageContent: normalizePageContent(value?.pageContent, preset.pageContent),
    sectionVisibility: normalizeSectionVisibility(value?.sectionVisibility),
    sectionOrder: normalizeSectionOrder(value?.sectionOrder, preset.sectionOrder),
    header: normalizeHeader(value?.header, preset.header),
    marquee: normalizeMarquee(value?.marquee, {
      ...preset.marquee,
      content: typeof value?.slogan === "string" ? value.slogan : preset.marquee.content,
    }),
    countdown: normalizeCountdown(value?.countdown, preset.countdown),
  }
}

function normalizeCountdown(
  value: Partial<CampaignCountdownConfig> | null | undefined,
  fallback: CampaignCountdownConfig
): CampaignCountdownConfig {
  if (!value || typeof value !== "object") {
    return { ...fallback }
  }

  const targetAt = typeof value.targetAt === "string" ? value.targetAt : ""

  return {
    completeLabel:
      typeof value.completeLabel === "string" && value.completeLabel.trim()
        ? value.completeLabel
        : fallback.completeLabel,
    enabled: value.enabled === true && targetAt.length > 0,
    label: typeof value.label === "string" && value.label.trim() ? value.label : fallback.label,
    targetAt,
  }
}

function normalizePreviewVideo(
  value: Partial<CampaignPreviewVideo> | null | undefined
): CampaignPreviewVideo {
  const url = typeof value?.url === "string" ? value.url : ""
  const posterUrl = typeof value?.posterUrl === "string" ? value.posterUrl : ""
  const autoplay = value?.autoplay === true

  return {
    autoplay,
    loop: value?.loop === true,
    muted: autoplay || value?.muted !== false,
    posterUrl,
    url,
  }
}

function normalizeImagePosition(
  value: Partial<CampaignImagePosition> | null | undefined
): CampaignImagePosition {
  const clampPosition = (position: number | undefined) =>
    typeof position === "number" && Number.isFinite(position)
      ? Math.min(100, Math.max(0, position))
      : 50

  return {
    x: clampPosition(value?.x),
    y: clampPosition(value?.y),
  }
}

function normalizeMotionSettings(
  value: Partial<CampaignMotionSettings> | null | undefined
): CampaignMotionSettings {
  const intensity =
    value?.intensity === "subtle" || value?.intensity === "balanced" || value?.intensity === "bold"
      ? value.intensity
      : defaultCampaignMotionSettings.intensity
  const speed =
    typeof value?.speed === "number" && Number.isFinite(value.speed)
      ? Math.min(1.8, Math.max(0.6, value.speed))
      : defaultCampaignMotionSettings.speed

  return {
    ambient: value?.ambient !== false,
    entrance: value?.entrance !== false,
    intensity,
    parallax: value?.parallax !== false,
    scrollReveal: value?.scrollReveal !== false,
    speed,
  }
}

const questionTypes = new Set<CampaignQuestionType>([
  "short_text",
  "single_choice",
  "multiple_choice",
])

function normalizeQuestionnaire(value: CampaignQuestionnaire | undefined): CampaignQuestionnaire {
  if (!value || typeof value !== "object") {
    return {
      ...defaultCampaignQuestionnaire,
      questions: defaultCampaignQuestionnaire.questions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    }
  }

  const questions = Array.isArray(value.questions)
    ? value.questions.flatMap((question, index) => {
        if (!question || typeof question !== "object") {
          return []
        }

        const type = questionTypes.has(question.type) ? question.type : "short_text"
        const options =
          type === "short_text" || !Array.isArray(question.options)
            ? []
            : question.options.filter((option) => typeof option === "string")

        return [
          {
            id:
              typeof question.id === "string" && /^[a-z0-9-]{1,64}$/.test(question.id)
                ? question.id
                : `question-${index + 1}`,
            label: typeof question.label === "string" ? question.label : "",
            type,
            required: question.required === true,
            placeholder: typeof question.placeholder === "string" ? question.placeholder : "",
            options,
          } satisfies CampaignQuestion,
        ]
      })
    : []

  return {
    enabled: value.enabled === true,
    title: typeof value.title === "string" ? value.title : defaultCampaignQuestionnaire.title,
    description:
      typeof value.description === "string"
        ? value.description
        : defaultCampaignQuestionnaire.description,
    questions,
  }
}

function clonePageContent(pageContent: CampaignPageContent): CampaignPageContent {
  return {
    ...pageContent,
    highlights: pageContent.highlights.map((highlight) => ({ ...highlight })),
    milestones: pageContent.milestones.map((milestone) => ({ ...milestone })),
  }
}

function normalizeSectionVisibility(
  value: CampaignSectionVisibility | undefined
): CampaignSectionVisibility {
  if (!value || typeof value !== "object") {
    return { ...defaultCampaignSectionVisibility }
  }

  return {
    hero: value.hero !== false,
    video: value.video !== false,
    highlights: value.highlights !== false,
    slogan: value.slogan !== false,
    timeline: value.timeline !== false,
    signup: value.signup !== false,
  }
}

function normalizeSectionOrder(
  value: CampaignBodySection[] | undefined,
  fallback: CampaignBodySection[]
): CampaignBodySection[] {
  const allowedSections = new Set<CampaignBodySection>(campaignBodySectionValues)
  const normalized =
    Array.isArray(value) &&
    (value.length === campaignBodySectionValues.length ||
      value.length === campaignBodySectionValues.length - 1)
      ? value.filter(
          (section, index): section is CampaignBodySection =>
            allowedSections.has(section) && value.indexOf(section) === index
        )
      : []

  if (normalized.length === campaignBodySectionValues.length - 1 && !normalized.includes("video")) {
    return ["video", ...normalized]
  }

  return normalized.length === campaignBodySectionValues.length ? normalized : [...fallback]
}

function normalizeHeader(
  value: CampaignHeaderConfig | undefined,
  fallback: CampaignHeaderConfig
): CampaignHeaderConfig {
  if (!value || typeof value !== "object") {
    return { ...fallback }
  }

  return {
    enabled: value.enabled !== false,
    brandLabel:
      typeof value.brandLabel === "string" && value.brandLabel.trim()
        ? value.brandLabel
        : fallback.brandLabel,
    metaLabel: typeof value.metaLabel === "string" ? value.metaLabel : fallback.metaLabel,
    showSlogan: value.showSlogan !== false,
  }
}

function normalizeMarquee(
  value: CampaignMarqueeConfig | undefined,
  fallback: CampaignMarqueeConfig
): CampaignMarqueeConfig {
  if (!value || typeof value !== "object") {
    return { ...fallback }
  }

  return {
    content:
      typeof value.content === "string" && value.content.trim() ? value.content : fallback.content,
    infinite: value.infinite !== false,
    speed:
      typeof value.speed === "number" && Number.isFinite(value.speed)
        ? Math.min(60, Math.max(8, Math.round(value.speed)))
        : fallback.speed,
  }
}

function normalizePageContent(
  value: CampaignPageContent | undefined,
  fallback: CampaignPageContent
): CampaignPageContent {
  if (!value || typeof value !== "object") {
    return clonePageContent(fallback)
  }

  const normalizeItems = <Item extends { label: string; title: string; description: string }>(
    items: Item[] | undefined,
    fallbackItems: Item[]
  ) =>
    Array.isArray(items) && items.length > 0
      ? items.slice(0, 6).map((item, index) => ({
          label: typeof item?.label === "string" ? item.label : (fallbackItems[index]?.label ?? ""),
          title: typeof item?.title === "string" ? item.title : (fallbackItems[index]?.title ?? ""),
          description:
            typeof item?.description === "string"
              ? item.description
              : (fallbackItems[index]?.description ?? ""),
        }))
      : fallbackItems.map((item) => ({ ...item }))

  return {
    sectionEyebrow:
      typeof value.sectionEyebrow === "string" ? value.sectionEyebrow : fallback.sectionEyebrow,
    highlights: normalizeItems(value.highlights, fallback.highlights),
    timelineTitle:
      typeof value.timelineTitle === "string" ? value.timelineTitle : fallback.timelineTitle,
    timelineDescription:
      typeof value.timelineDescription === "string"
        ? value.timelineDescription
        : fallback.timelineDescription,
    milestones: normalizeItems(value.milestones, fallback.milestones),
    closingTitle:
      typeof value.closingTitle === "string" ? value.closingTitle : fallback.closingTitle,
    closingDescription:
      typeof value.closingDescription === "string"
        ? value.closingDescription
        : fallback.closingDescription,
  }
}

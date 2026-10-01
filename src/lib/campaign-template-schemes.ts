import type { CampaignBodySection, CampaignTemplate } from "@/types/database"

export type CampaignComposition =
  | "archive"
  | "editorial"
  | "grid"
  | "orbit"
  | "poster"
  | "studio"
  | "ticket"

export type CampaignHeroMedia = "after-copy" | "background" | "before-copy"
export type CampaignHighlightsLayout = "cards" | "index" | "mosaic" | "rail"
export type CampaignTimelineLayout = "compact" | "horizontal" | "staggered" | "vertical"
export type CampaignClosingLayout = "reverse" | "split" | "stacked"
export type CampaignSubscriptionLayout = "column" | "matrix" | "sidebar"

export interface CampaignTemplateLayout {
  sectionOrder: CampaignBodySection[]
  heroMedia: CampaignHeroMedia
  highlights: CampaignHighlightsLayout
  timeline: CampaignTimelineLayout
  closing: CampaignClosingLayout
  subscription: CampaignSubscriptionLayout
}

export interface CampaignTemplateScheme {
  code: string
  label: string
  navigationLabel: string
  composition: CampaignComposition
  tone: "dark" | "light"
  heroLayout: "center" | "offset" | "split"
  font: "display" | "mono" | "sans"
  layout: CampaignTemplateLayout
  colors: {
    background: string
    surface: string
    text: string
    muted: string
    grid: string
  }
}

export const campaignTemplateSchemes: Record<CampaignTemplate, CampaignTemplateScheme> = {
  launch: {
    code: "LCH-01",
    label: "轨道首发",
    navigationLabel: "RELEASE CONTROL",
    composition: "orbit",
    tone: "dark",
    heroLayout: "offset",
    font: "display",
    layout: {
      sectionOrder: ["video", "highlights", "slogan", "timeline", "signup"],
      heroMedia: "after-copy",
      highlights: "rail",
      timeline: "horizontal",
      closing: "split",
      subscription: "column",
    },
    colors: {
      background: "#080b0a",
      surface: "#111614",
      text: "#f5f3eb",
      muted: "#9ca8a3",
      grid: "#30443c",
    },
  },
  editorial: {
    code: "ARC-02",
    label: "未来档案",
    navigationLabel: "FIELD ARCHIVE",
    composition: "editorial",
    tone: "light",
    heroLayout: "split",
    font: "display",
    layout: {
      sectionOrder: ["video", "highlights", "timeline", "slogan", "signup"],
      heroMedia: "before-copy",
      highlights: "index",
      timeline: "vertical",
      closing: "stacked",
      subscription: "matrix",
    },
    colors: {
      background: "#edf0e9",
      surface: "#fafbf5",
      text: "#132019",
      muted: "#657168",
      grid: "#9ca99f",
    },
  },
  signal: {
    code: "SIG-03",
    label: "信号终端",
    navigationLabel: "PRIVATE CHANNEL",
    composition: "grid",
    tone: "dark",
    heroLayout: "offset",
    font: "mono",
    layout: {
      sectionOrder: ["video", "slogan", "highlights", "timeline", "signup"],
      heroMedia: "after-copy",
      highlights: "cards",
      timeline: "compact",
      closing: "reverse",
      subscription: "matrix",
    },
    colors: {
      background: "#04100c",
      surface: "#0b1b15",
      text: "#e3ffef",
      muted: "#79a58d",
      grid: "#1c6a49",
    },
  },
  orbit: {
    code: "ORB-04",
    label: "深空轨道",
    navigationLabel: "ORBITAL WINDOW",
    composition: "orbit",
    tone: "dark",
    heroLayout: "center",
    font: "display",
    layout: {
      sectionOrder: ["video", "highlights", "timeline", "signup", "slogan"],
      heroMedia: "background",
      highlights: "rail",
      timeline: "staggered",
      closing: "stacked",
      subscription: "column",
    },
    colors: {
      background: "#070b10",
      surface: "#111923",
      text: "#eef5f8",
      muted: "#8da0aa",
      grid: "#315564",
    },
  },
  prism: {
    code: "PRM-05",
    label: "光谱界面",
    navigationLabel: "SPECTRUM RELEASE",
    composition: "studio",
    tone: "light",
    heroLayout: "split",
    font: "sans",
    layout: {
      sectionOrder: ["video", "highlights", "slogan", "signup", "timeline"],
      heroMedia: "before-copy",
      highlights: "mosaic",
      timeline: "horizontal",
      closing: "reverse",
      subscription: "matrix",
    },
    colors: {
      background: "#f2f5ed",
      surface: "#ffffff",
      text: "#101d1b",
      muted: "#697572",
      grid: "#9aa9a3",
    },
  },
  monolith: {
    code: "MNL-06",
    label: "核心舱",
    navigationLabel: "CORE SYSTEM",
    composition: "archive",
    tone: "dark",
    heroLayout: "offset",
    font: "sans",
    layout: {
      sectionOrder: ["video", "timeline", "highlights", "slogan", "signup"],
      heroMedia: "after-copy",
      highlights: "cards",
      timeline: "vertical",
      closing: "split",
      subscription: "column",
    },
    colors: {
      background: "#090909",
      surface: "#171816",
      text: "#f2efe7",
      muted: "#a6a49b",
      grid: "#454840",
    },
  },
  atelier: {
    code: "ATL-07",
    label: "瑞士工坊",
    navigationLabel: "EDITION STUDIO",
    composition: "grid",
    tone: "light",
    heroLayout: "split",
    font: "sans",
    layout: {
      sectionOrder: ["video", "highlights", "signup", "timeline", "slogan"],
      heroMedia: "before-copy",
      highlights: "index",
      timeline: "compact",
      closing: "reverse",
      subscription: "sidebar",
    },
    colors: {
      background: "#f1efe7",
      surface: "#fffdf5",
      text: "#151510",
      muted: "#6c6a61",
      grid: "#908f87",
    },
  },
  nocturne: {
    code: "NCT-08",
    label: "午夜首映",
    navigationLabel: "PRIVATE PREMIERE",
    composition: "studio",
    tone: "dark",
    heroLayout: "center",
    font: "display",
    layout: {
      sectionOrder: ["video", "slogan", "timeline", "highlights", "signup"],
      heroMedia: "before-copy",
      highlights: "mosaic",
      timeline: "staggered",
      closing: "stacked",
      subscription: "column",
    },
    colors: {
      background: "#0c090a",
      surface: "#1d1518",
      text: "#f9efe6",
      muted: "#b4a5a2",
      grid: "#684350",
    },
  },
  kinetic: {
    code: "KNT-09",
    label: "动态宣言",
    navigationLabel: "MOTION ISSUE",
    composition: "poster",
    tone: "light",
    heroLayout: "offset",
    font: "sans",
    layout: {
      sectionOrder: ["video", "slogan", "highlights", "signup", "timeline"],
      heroMedia: "after-copy",
      highlights: "mosaic",
      timeline: "compact",
      closing: "reverse",
      subscription: "matrix",
    },
    colors: {
      background: "#f1f038",
      surface: "#fffceb",
      text: "#12130f",
      muted: "#5d5e50",
      grid: "#22251e",
    },
  },
  broadsheet: {
    code: "NWS-10",
    label: "晨间头版",
    navigationLabel: "THE MORNING EDITION",
    composition: "editorial",
    tone: "light",
    heroLayout: "center",
    font: "display",
    layout: {
      sectionOrder: ["video", "timeline", "highlights", "signup", "slogan"],
      heroMedia: "background",
      highlights: "index",
      timeline: "vertical",
      closing: "stacked",
      subscription: "matrix",
    },
    colors: {
      background: "#eee9dd",
      surface: "#fbf7ec",
      text: "#231e19",
      muted: "#746a60",
      grid: "#9e9082",
    },
  },
  playground: {
    code: "PLY-11",
    label: "彩色游乐场",
    navigationLabel: "PLAY MODE",
    composition: "poster",
    tone: "light",
    heroLayout: "split",
    font: "sans",
    layout: {
      sectionOrder: ["video", "slogan", "signup", "highlights", "timeline"],
      heroMedia: "before-copy",
      highlights: "cards",
      timeline: "staggered",
      closing: "split",
      subscription: "matrix",
    },
    colors: {
      background: "#f5d84b",
      surface: "#fff5c7",
      text: "#171714",
      muted: "#655f4a",
      grid: "#2457d6",
    },
  },
  ledger: {
    code: "LDG-12",
    label: "登机票据",
    navigationLabel: "BOARDING GROUP",
    composition: "ticket",
    tone: "light",
    heroLayout: "offset",
    font: "mono",
    layout: {
      sectionOrder: ["video", "signup", "highlights", "timeline", "slogan"],
      heroMedia: "after-copy",
      highlights: "index",
      timeline: "compact",
      closing: "reverse",
      subscription: "sidebar",
    },
    colors: {
      background: "#ece8dc",
      surface: "#fffdf5",
      text: "#151713",
      muted: "#686b62",
      grid: "#8c9187",
    },
  },
  terrain: {
    code: "TRN-13",
    label: "地形图谱",
    navigationLabel: "FIELD STATION",
    composition: "archive",
    tone: "dark",
    heroLayout: "split",
    font: "sans",
    layout: {
      sectionOrder: ["video", "timeline", "slogan", "highlights", "signup"],
      heroMedia: "before-copy",
      highlights: "mosaic",
      timeline: "vertical",
      closing: "split",
      subscription: "column",
    },
    colors: {
      background: "#0b1711",
      surface: "#14251b",
      text: "#f0f4e7",
      muted: "#9dab9b",
      grid: "#46614d",
    },
  },
  broadcast: {
    code: "AIR-14",
    label: "声场电台",
    navigationLabel: "LIVE FREQUENCY",
    composition: "studio",
    tone: "dark",
    heroLayout: "center",
    font: "mono",
    layout: {
      sectionOrder: ["video", "timeline", "signup", "highlights", "slogan"],
      heroMedia: "background",
      highlights: "rail",
      timeline: "compact",
      closing: "stacked",
      subscription: "column",
    },
    colors: {
      background: "#101211",
      surface: "#1b201e",
      text: "#f1f5ef",
      muted: "#97aaa2",
      grid: "#31584c",
    },
  },
  catalog: {
    code: "CAT-15",
    label: "银幕目录",
    navigationLabel: "COLLECTION INDEX",
    composition: "archive",
    tone: "light",
    heroLayout: "split",
    font: "sans",
    layout: {
      sectionOrder: ["video", "signup", "timeline", "highlights", "slogan"],
      heroMedia: "before-copy",
      highlights: "cards",
      timeline: "horizontal",
      closing: "reverse",
      subscription: "sidebar",
    },
    colors: {
      background: "#f3f3ef",
      surface: "#ffffff",
      text: "#111310",
      muted: "#686c65",
      grid: "#a7aaa2",
    },
  },
  biolab: {
    code: "BIO-16",
    label: "生物实验室",
    navigationLabel: "SPECIMEN RECORD",
    composition: "grid",
    tone: "light",
    heroLayout: "offset",
    font: "display",
    layout: {
      sectionOrder: ["video", "signup", "highlights", "slogan", "timeline"],
      heroMedia: "after-copy",
      highlights: "mosaic",
      timeline: "staggered",
      closing: "split",
      subscription: "matrix",
    },
    colors: {
      background: "#edf2e9",
      surface: "#fbfff8",
      text: "#172019",
      muted: "#647268",
      grid: "#8fa395",
    },
  },
}

export function getCampaignTemplateScheme(template: CampaignTemplate) {
  return campaignTemplateSchemes[template]
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type CampaignStatus = "draft" | "published"
export type CampaignMotion = "cascade" | "drift" | "kinetic" | "parallax" | "pulse" | "scan"
export type CampaignMotionIntensity = "bold" | "balanced" | "subtle"
export type CampaignQuestionType = "multiple_choice" | "short_text" | "single_choice"
export const campaignBodySectionValues = [
  "video",
  "highlights",
  "slogan",
  "timeline",
  "signup",
] as const
export type CampaignBodySection = (typeof campaignBodySectionValues)[number]
export const campaignTemplateValues = [
  "atelier",
  "biolab",
  "broadsheet",
  "broadcast",
  "catalog",
  "editorial",
  "kinetic",
  "launch",
  "ledger",
  "monolith",
  "nocturne",
  "orbit",
  "playground",
  "prism",
  "signal",
  "terrain",
] as const
export type CampaignTemplate = (typeof campaignTemplateValues)[number]

export interface CampaignQuestion {
  id: string
  label: string
  type: CampaignQuestionType
  required: boolean
  placeholder: string
  options: string[]
}

export interface CampaignQuestionnaire {
  enabled: boolean
  title: string
  description: string
  questions: CampaignQuestion[]
}

export interface CampaignPageHighlight {
  label: string
  title: string
  description: string
}

export interface CampaignPageMilestone {
  label: string
  title: string
  description: string
}

export interface CampaignPageContent {
  sectionEyebrow: string
  highlights: CampaignPageHighlight[]
  timelineTitle: string
  timelineDescription: string
  milestones: CampaignPageMilestone[]
  closingTitle: string
  closingDescription: string
}

export interface CampaignSectionVisibility {
  hero: boolean
  video: boolean
  highlights: boolean
  slogan: boolean
  timeline: boolean
  signup: boolean
}

export interface CampaignHeaderConfig {
  enabled: boolean
  brandLabel: string
  metaLabel: string
  showSlogan: boolean
}

export interface CampaignMarqueeConfig {
  content: string
  infinite: boolean
  speed: number
}

export interface CampaignCountdownConfig {
  completeLabel: string
  enabled: boolean
  label: string
  targetAt: string
}

export interface CampaignMotionSettings {
  ambient: boolean
  entrance: boolean
  intensity: CampaignMotionIntensity
  parallax: boolean
  scrollReveal: boolean
  speed: number
}

export interface CampaignPreviewVideo {
  autoplay: boolean
  loop: boolean
  muted: boolean
  posterUrl: string
  url: string
}

export interface CampaignImagePosition {
  x: number
  y: number
}

export type CampaignQuestionAnswers = Record<string, string | string[]>

export const analyticsRangeValues = [7, 30, 90] as const
export type AnalyticsRange = (typeof analyticsRangeValues)[number]

export interface AnalyticsDailyPoint {
  date: string
  pageViews: number
  uniqueVisitors: number
  applications: number
}

export interface CampaignAnalytics {
  id: string
  name: string
  slug: string
  pageViews: number
  uniqueVisitors: number
  sessions: number
  applications: number
  totalApplications: number
  conversionRate: number
  averageDurationSeconds: number
  averageScrollDepth: number
}

export interface TrafficAnalyticsItem {
  label: string
  pageViews: number
  uniqueVisitors: number
  averageDurationSeconds: number
  averageScrollDepth: number
}

export interface ApplicationAnalyticsItem {
  label: string
  applications: number
}

export interface LocationAnalyticsItem {
  city: string | null
  countryCode: string | null
  region: string | null
  pageViews: number
  uniqueVisitors: number
  averageDurationSeconds: number
}

export interface QuestionOptionAnalytics {
  label: string
  selections: number
}

export interface QuestionAnalytics {
  campaignId: string
  campaignName: string
  questionId: string
  label: string
  type: CampaignQuestionType
  required: boolean
  totalApplications: number
  responses: number
  options: QuestionOptionAnalytics[]
}

export interface ProjectAnalytics {
  rangeDays: number
  periodStart: string
  totals: {
    publishedCampaigns: number
    pageViews: number
    uniqueVisitors: number
    sessions: number
    applications: number
    conversionRate: number
    returningVisitorRate: number
    pageViewsPerVisitor: number
    averageDurationSeconds: number
    averageScrollDepth: number
    averageInteractions: number
    engagedViewRate: number
    allTimePageViews: number
    allTimeUniqueVisitors: number
    allTimeApplications: number
  }
  daily: AnalyticsDailyPoint[]
  campaigns: CampaignAnalytics[]
  sources: TrafficAnalyticsItem[]
  devices: TrafficAnalyticsItem[]
  locations: LocationAnalyticsItem[]
  emailDomains: ApplicationAnalyticsItem[]
  questionInsights: QuestionAnalytics[]
}

export interface CampaignConfig {
  title: string
  slogan: string
  description: string
  featureTitle: string
  featureDescription: string
  eyebrow: string
  emailLabel: string
  buttonLabel: string
  successMessage: string
  coverImage: string
  coverImagePosition: CampaignImagePosition
  previewVideo: CampaignPreviewVideo
  themeColor: string
  template: CampaignTemplate
  motion: CampaignMotion
  motionSettings: CampaignMotionSettings
  questionnaire: CampaignQuestionnaire
  pageContent: CampaignPageContent
  sectionVisibility: CampaignSectionVisibility
  sectionOrder: CampaignBodySection[]
  header: CampaignHeaderConfig
  marquee: CampaignMarqueeConfig
  countdown: CampaignCountdownConfig
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  slug: string
  status: CampaignStatus
  draft_config: CampaignConfig
  published_config: CampaignConfig | null
  subscriber_count: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PublicCampaign {
  id: string
  slug: string
  config: CampaignConfig
  publishedAt: string
}

export interface Subscriber {
  id: string
  campaign_id: string
  email: string
  answers: CampaignQuestionAnswers
  created_at: string
  analytics: SubscriberAnalytics | null
}

export interface SubscriberAnalytics {
  campaignTag: string | null
  city: string | null
  countryCode: string | null
  deviceType: "desktop" | "mobile" | "tablet" | "unknown"
  engagementSeconds: number
  firstSeenAt: string
  interactionCount: number
  lastSeenAt: string
  locale: string | null
  maxScrollDepth: number
  medium: string | null
  pageViews: number
  region: string | null
  sessions: number
  source: string
  timezone: string | null
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          status: CampaignStatus
          draft_config: CampaignConfig
          published_config: CampaignConfig | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          status?: CampaignStatus
          draft_config: CampaignConfig
          published_config?: CampaignConfig | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          status?: CampaignStatus
          draft_config?: CampaignConfig
          published_config?: CampaignConfig | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          id: string
          campaign_id: string
          email: string
          answers: CampaignQuestionAnswers
          visitor_hash: string | null
          session_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          email: string
          answers?: CampaignQuestionAnswers
          visitor_hash?: string | null
          session_hash?: string | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      campaign_page_views: {
        Row: {
          id: number
          campaign_id: string
          view_hash: string
          visitor_hash: string
          session_hash: string
          referrer_host: string | null
          source: string
          medium: string | null
          campaign_tag: string | null
          device_type: "desktop" | "mobile" | "tablet" | "unknown"
          locale: string | null
          timezone: string | null
          country_code: string | null
          region: string | null
          city: string | null
          duration_seconds: number
          max_scroll_depth: number
          interaction_count: number
          viewed_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_campaigns_with_counts: {
        Args: Record<string, never>
        Returns: Campaign[]
      }
      get_campaign_subscribers_with_analytics: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      get_published_campaign: {
        Args: { p_slug: string }
        Returns: Array<{
          id: string
          slug: string
          published_config: CampaignConfig
          published_at: string
        }>
      }
      get_campaign_analytics: {
        Args: { p_campaign_id: string; p_days?: number }
        Returns: Json
      }
      get_campaign_behavior_analytics: {
        Args: { p_campaign_id: string; p_days?: number }
        Returns: Json
      }
      subscribe_to_campaign: {
        Args: {
          p_answers?: Json
          p_email: string
          p_session_id?: string | null
          p_slug: string
          p_visitor_id?: string | null
        }
        Returns: Json
      }
      track_campaign_page_view: {
        Args: {
          p_campaign?: string | null
          p_city?: string | null
          p_country_code?: string | null
          p_device_type?: "desktop" | "mobile" | "tablet" | "unknown"
          p_locale?: string | null
          p_medium?: string | null
          p_referrer_host?: string | null
          p_region?: string | null
          p_session_id: string
          p_slug: string
          p_source?: string | null
          p_timezone?: string | null
          p_view_id: string
          p_visitor_id: string
        }
        Returns: boolean
      }
      track_campaign_page_engagement: {
        Args: {
          p_duration_seconds: number
          p_interaction_count: number
          p_max_scroll_depth: number
          p_slug: string
          p_view_id: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

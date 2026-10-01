import { NextResponse } from "next/server"
import { z } from "zod"

import { demoCampaignSlug } from "@/lib/campaigns"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const engagementSchema = z.object({
  durationSeconds: z.number().int().min(0).max(86400),
  interactionCount: z.number().int().min(0).max(10000),
  maxScrollDepth: z.number().int().min(0).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  viewId: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
})

export async function POST(request: Request) {
  const result = engagementSchema.safeParse(await request.json().catch(() => null))

  if (!result.success || result.data.slug === demoCampaignSlug) {
    return new NextResponse(null, { status: 204 })
  }

  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return new NextResponse(null, { status: 204 })
  }

  const { error } = await supabase.rpc("track_campaign_page_engagement", {
    p_duration_seconds: result.data.durationSeconds,
    p_interaction_count: result.data.interactionCount,
    p_max_scroll_depth: result.data.maxScrollDepth,
    p_slug: result.data.slug,
    p_view_id: result.data.viewId,
  })

  return error
    ? NextResponse.json({ error: "Unable to update engagement" }, { status: 400 })
    : new NextResponse(null, { status: 204 })
}

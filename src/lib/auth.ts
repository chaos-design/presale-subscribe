import { cache } from "react"

import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export interface AppUser {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  isDemo: boolean
}

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  const id = typeof claims?.sub === "string" ? claims.sub : ""
  const email = typeof claims?.email === "string" ? claims.email.trim() : ""

  if (error || !id || !email) {
    return null
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", id)
    .maybeSingle()
  const metadata =
    claims?.user_metadata && typeof claims.user_metadata === "object"
      ? (claims.user_metadata as Record<string, unknown>)
      : {}
  const metadataName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : null
  const metadataAvatar = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null

  return {
    id,
    email,
    name: profile?.full_name ?? metadataName ?? email.split("@")[0] ?? "REPS 用户",
    avatarUrl: profile?.avatar_url ?? metadataAvatar,
    isDemo: false,
  }
})

export function getDemoUser(): AppUser {
  return {
    id: "demo-user",
    email: "demo@reps.local",
    name: "演示工作区",
    avatarUrl: null,
    isDemo: true,
  }
}

export function isDemoMode() {
  return !isSupabaseConfigured()
}

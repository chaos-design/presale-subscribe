"use client"

import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseConfig } from "@/lib/supabase/config"
import type { Database } from "@/types/database"

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig()

  if (!config) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(config.url, config.publishableKey)
  }

  return browserClient
}

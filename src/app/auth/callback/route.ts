import { type NextRequest, NextResponse } from "next/server"

import { sanitizeRedirectPath } from "@/lib/redirect-path"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const redirectPath = sanitizeRedirectPath(request.nextUrl.searchParams.get("next"))
  const supabase = await createSupabaseServerClient()

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("error", "callback")
  loginUrl.searchParams.set("next", redirectPath)

  return NextResponse.redirect(loginUrl)
}

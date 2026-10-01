import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const sqlFiles = ["supabase/platform.sql", "supabase/update.sql"] as const

describe.each(sqlFiles)("%s", (path) => {
  const sql = readFileSync(join(process.cwd(), path), "utf8")

  it("keeps anonymous subscriptions idempotent and response-neutral", () => {
    expect(sql).toContain("on conflict (campaign_id, email)")
    expect(sql).toMatch(/on conflict \(campaign_id, email\)\s+do nothing;/)
    expect(sql).toContain("return jsonb_build_object('ok', true);")
    expect(sql).not.toContain("'already_subscribed'")
  })

  it("does not grant anonymous access to media object metadata", () => {
    expect(sql).toContain('drop policy if exists "Public can read campaign media"')
    expect(sql).not.toContain('create policy "Public can read campaign media"')
  })
})

import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { commonEmailDomains } from "@/lib/common-email-domains"
import { campaignTemplateValues } from "@/types/database"

const readRepositoryFile = (path: string) => readFileSync(join(process.cwd(), path), "utf8")

const sqlFiles = ["supabase/platform.sql", "supabase/update.sql"] as const

function readSqlEmailDomains(sql: string) {
  const block = /not in \(([\s\S]*?)\)\s*then/.exec(sql)
  const domains = [...(block?.[1].matchAll(/'([a-z0-9.]+)'/g) ?? [])].map((match) => match[1])
  return domains.sort()
}

function readSqlMediaBucket(sql: string) {
  const block = /insert into storage\.buckets \(([\s\S]*?)\ncommit;/.exec(sql)
  const insert = block?.[1] ?? ""
  return {
    fileSizeLimit: Number(/values \([\s\S]*?,\s*(\d+),/.exec(insert)?.[1] ?? 0),
    mimeTypes: [...insert.matchAll(/'(image\/[a-z]+|video\/[a-z0-9]+)'/g)].map((match) => match[1]),
  }
}

const editorLimits = {
  coverImage:
    Number(
      /const maxCoverImageSize = (\d+) \* 1024 \* 1024/.exec(
        readRepositoryFile("src/components/campaign-editor.tsx")
      )?.[1] ?? 0
    ) *
    1024 *
    1024,
  previewVideo:
    Number(
      /const maxPreviewVideoSize = (\d+) \* 1024 \* 1024/.exec(
        readRepositoryFile("src/components/campaign-editor.tsx")
      )?.[1] ?? 0
    ) *
    1024 *
    1024,
}

describe.each(sqlFiles)("%s", (path) => {
  const sql = readRepositoryFile(path)

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

  it("mirrors the email domain allowlist used by the reservation form", () => {
    expect(readSqlEmailDomains(sql)).toEqual([...commonEmailDomains].sort())
  })

  it("mirrors the media limits documented in the user guide", () => {
    const bucket = readSqlMediaBucket(sql)

    expect(bucket.fileSizeLimit).toBe(editorLimits.previewVideo)
    expect(bucket.mimeTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ])
  })
})

describe("application and database parity", () => {
  it("keeps the editor cover image limit below the bucket limit", () => {
    expect(editorLimits.coverImage).toBe(8 * 1024 * 1024)
    expect(editorLimits.coverImage).toBeLessThan(editorLimits.previewVideo)
  })

  it("ships the sixteen templates the user guide advertises", () => {
    expect(campaignTemplateValues).toHaveLength(16)
  })
})

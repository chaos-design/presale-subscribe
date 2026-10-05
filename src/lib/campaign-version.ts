import { createHash } from "node:crypto"

import type { CampaignConfig } from "@/types/database"

const campaignVersionLength = 8

// 键顺序不影响内容指纹，保证同一份配置每次发布都得到相同版本号。
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)

    return `{${entries.join(",")}}`
  }

  return JSON.stringify(value) ?? "null"
}

export function createCampaignVersion(config: CampaignConfig): string {
  return createHash("sha256")
    .update(stableStringify(config))
    .digest("hex")
    .slice(0, campaignVersionLength)
}

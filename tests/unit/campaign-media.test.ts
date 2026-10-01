import { describe, expect, it, vi } from "vitest"

import { type CampaignMediaBucket, deleteCampaignMedia } from "@/lib/campaign-media"

function createBucket(
  filesByDirectory: Record<string, Array<{ id: string | null; name: string }>>
) {
  const removedPaths: string[][] = []
  const bucket: CampaignMediaBucket = {
    list: vi.fn(async (path = "", options = {}) => {
      const files = filesByDirectory[path] ?? []
      const offset = options.offset ?? 0
      const limit = options.limit ?? 100

      return {
        data: files.slice(offset, offset + limit),
        error: null,
      }
    }),
    remove: vi.fn(async (paths) => {
      removedPaths.push(paths)
      return { data: [], error: null }
    }),
  }

  return { bucket, removedPaths }
}

describe("deleteCampaignMedia", () => {
  it("removes every file under the campaign directory, including nested folders", async () => {
    const { bucket, removedPaths } = createBucket({
      "user-1/campaign-1": [
        { id: "cover-id", name: "cover.webp" },
        { id: null, name: "video" },
      ],
      "user-1/campaign-1/video": [
        { id: "video-id", name: "preview.mp4" },
        { id: "poster-id", name: "poster.jpg" },
      ],
    })

    const deletedCount = await deleteCampaignMedia(bucket, "user-1", "campaign-1")

    expect(deletedCount).toBe(3)
    expect(removedPaths.flat()).toEqual([
      "user-1/campaign-1/cover.webp",
      "user-1/campaign-1/video/preview.mp4",
      "user-1/campaign-1/video/poster.jpg",
    ])
  })

  it("paginates listings and deletes large directories in batches", async () => {
    const files = Array.from({ length: 205 }, (_, index) => ({
      id: `file-${index}`,
      name: `asset-${index}.bin`,
    }))
    const { bucket, removedPaths } = createBucket({
      "user-1/campaign-1": files,
    })

    const deletedCount = await deleteCampaignMedia(bucket, "user-1", "campaign-1")

    expect(deletedCount).toBe(205)
    expect(removedPaths.map((batch) => batch.length)).toEqual([100, 100, 5])
    expect(bucket.list).toHaveBeenCalledTimes(3)
  })

  it("stops before deleting records when storage cleanup fails", async () => {
    const bucket: CampaignMediaBucket = {
      list: vi.fn(async () => ({
        data: null,
        error: { message: "storage unavailable" },
      })),
      remove: vi.fn(),
    }

    await expect(deleteCampaignMedia(bucket, "user-1", "campaign-1")).rejects.toThrow(
      "无法读取项目媒体：storage unavailable"
    )
    expect(bucket.remove).not.toHaveBeenCalled()
  })
})

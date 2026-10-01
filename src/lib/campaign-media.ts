const storagePageSize = 100
const storageDeleteBatchSize = 100

interface CampaignMediaEntry {
  id: string | null
  name: string
}

interface CampaignMediaError {
  message: string
}

export interface CampaignMediaBucket {
  list(
    path?: string,
    options?: { limit?: number; offset?: number }
  ): Promise<
    { data: CampaignMediaEntry[]; error: null } | { data: null; error: CampaignMediaError }
  >
  remove(
    paths: string[]
  ): Promise<{ data: unknown; error: null } | { data: null; error: CampaignMediaError }>
}

async function listCampaignMediaPaths(bucket: CampaignMediaBucket, rootPath: string) {
  const directories = [rootPath]
  const objectPaths: string[] = []

  for (let directoryIndex = 0; directoryIndex < directories.length; directoryIndex += 1) {
    const directory = directories[directoryIndex]

    for (let offset = 0; ; offset += storagePageSize) {
      const { data, error } = await bucket.list(directory, {
        limit: storagePageSize,
        offset,
      })

      if (error) {
        throw new Error(`无法读取项目媒体：${error.message}`)
      }

      for (const entry of data) {
        const path = `${directory}/${entry.name}`

        if (entry.id) {
          objectPaths.push(path)
        } else {
          directories.push(path)
        }
      }

      if (data.length < storagePageSize) {
        break
      }
    }
  }

  return objectPaths
}

export async function deleteCampaignMedia(
  bucket: CampaignMediaBucket,
  userId: string,
  campaignId: string
) {
  const objectPaths = await listCampaignMediaPaths(bucket, `${userId}/${campaignId}`)

  for (let offset = 0; offset < objectPaths.length; offset += storageDeleteBatchSize) {
    const { error } = await bucket.remove(
      objectPaths.slice(offset, offset + storageDeleteBatchSize)
    )

    if (error) {
      throw new Error(`无法删除项目媒体：${error.message}`)
    }
  }

  return objectPaths.length
}

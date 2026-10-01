const countryNames = new Intl.DisplayNames(["zh-CN"], { type: "region" })

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))

  if (seconds < 60) {
    return `${seconds} 秒`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes} 分 ${remainingSeconds} 秒` : `${minutes} 分钟`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours} 小时 ${remainingMinutes} 分` : `${hours} 小时`
}

export function getCountryName(countryCode: string | null) {
  if (!countryCode) {
    return null
  }

  try {
    return countryNames.of(countryCode.toUpperCase()) ?? countryCode.toUpperCase()
  } catch {
    return countryCode.toUpperCase()
  }
}

export function formatLocation({
  city,
  countryCode,
  region,
}: {
  city: string | null
  countryCode: string | null
  region: string | null
}) {
  const segments = [getCountryName(countryCode), region, city].filter(
    (segment, index, values): segment is string =>
      Boolean(segment) && values.indexOf(segment) === index
  )

  return segments.length > 0 ? segments.join(" · ") : "未知地区"
}

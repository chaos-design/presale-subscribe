import { isIP } from "node:net"
import { z } from "zod"

export interface RequestLocation {
  city: string | null
  countryCode: string | null
  region: string | null
}

const ipLocationResponseSchema = z.object({
  success: z.boolean(),
  country_code: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
})

function normalizeText(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return null
  }

  try {
    return decodeURIComponent(value).trim().slice(0, maxLength) || null
  } catch {
    return value.trim().slice(0, maxLength) || null
  }
}

function normalizeCountryCode(value: string | null | undefined) {
  const countryCode = normalizeText(value, 2)?.toUpperCase() ?? null
  return countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null
}

function isPublicIpv4(ip: string) {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false
  }

  const [first, second, third] = parts
  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  )
}

function isPublicIp(ip: string) {
  const version = isIP(ip)
  if (version === 4) {
    return isPublicIpv4(ip)
  }

  if (version !== 6) {
    return false
  }

  const normalized = ip.toLowerCase()
  if (normalized.startsWith("::ffff:")) {
    return isPublicIpv4(normalized.slice(7))
  }

  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("2001:db8:")
  )
}

export function extractPublicClientIp(requestHeaders: Pick<Headers, "get">) {
  const candidates = [
    requestHeaders.get("cf-connecting-ip"),
    requestHeaders.get("x-real-ip"),
    requestHeaders.get("true-client-ip"),
    ...(requestHeaders.get("x-forwarded-for") ?? "").split(","),
  ]

  for (const candidate of candidates) {
    const ip = candidate?.trim().replace(/^\[|\]$/g, "")
    if (ip && isPublicIp(ip)) {
      return ip
    }
  }

  return null
}

export function readLocationHeaders(requestHeaders: Pick<Headers, "get">): RequestLocation {
  return {
    countryCode: normalizeCountryCode(
      requestHeaders.get("x-vercel-ip-country") ?? requestHeaders.get("cf-ipcountry")
    ),
    region: normalizeText(
      requestHeaders.get("x-vercel-ip-country-region") ??
        requestHeaders.get("cf-region") ??
        requestHeaders.get("x-appengine-region"),
      120
    ),
    city: normalizeText(
      requestHeaders.get("x-vercel-ip-city") ??
        requestHeaders.get("cf-ipcity") ??
        requestHeaders.get("x-appengine-city"),
      120
    ),
  }
}

async function lookupIpLocation(ip: string): Promise<RequestLocation | null> {
  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code,region,city`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(1200),
      }
    )

    if (!response.ok) {
      return null
    }

    const result = ipLocationResponseSchema.safeParse(await response.json())
    if (!result.success || !result.data.success) {
      return null
    }

    return {
      countryCode: normalizeCountryCode(result.data.country_code),
      region: normalizeText(result.data.region, 120),
      city: normalizeText(result.data.city, 120),
    }
  } catch {
    return null
  }
}

export async function resolveRequestLocation(
  requestHeaders: Pick<Headers, "get">
): Promise<RequestLocation> {
  const headerLocation = readLocationHeaders(requestHeaders)

  if (headerLocation.countryCode && headerLocation.region && headerLocation.city) {
    return headerLocation
  }

  const ip = extractPublicClientIp(requestHeaders)
  const ipLocation = ip ? await lookupIpLocation(ip) : null

  return {
    countryCode: headerLocation.countryCode ?? ipLocation?.countryCode ?? null,
    region: headerLocation.region ?? ipLocation?.region ?? null,
    city: headerLocation.city ?? ipLocation?.city ?? null,
  }
}

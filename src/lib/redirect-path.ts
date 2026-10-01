const defaultRedirectPath = "/dashboard"

export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = defaultRedirectPath
) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /^[a-z][a-z\d+.-]*:/i.test(value)
  ) {
    return fallback
  }

  try {
    const url = new URL(value, "https://ahead.local")

    return url.origin === "https://ahead.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}

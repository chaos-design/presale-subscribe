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
    const url = new URL(value, "https://reps.local")

    return url.origin === "https://reps.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback
  } catch {
    return fallback
  }
}

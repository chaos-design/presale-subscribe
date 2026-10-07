"use client"

const visitorStorageKey = "reps:analytics:visitor:v1"
const sessionStorageKey = "reps:analytics:session:v1"
const identifierPattern = /^[A-Za-z0-9_-]{16,128}$/

function getOrCreateIdentifier(storage: Storage, key: string) {
  const existing = storage.getItem(key)

  if (existing && identifierPattern.test(existing)) {
    return existing
  }

  const identifier = crypto.randomUUID()
  storage.setItem(key, identifier)
  return identifier
}

export function getAnalyticsIdentifiers() {
  try {
    return {
      visitorId: getOrCreateIdentifier(window.localStorage, visitorStorageKey),
      sessionId: getOrCreateIdentifier(window.sessionStorage, sessionStorageKey),
    }
  } catch {
    return {
      visitorId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
    }
  }
}

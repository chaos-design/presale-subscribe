#!/usr/bin/env bash
# Local rehearsal of the credential and environment checks the Publish workflow performs,
# so a misconfigured Vercel project fails here in seconds instead of after a full CI run.
#
# Usage:
#   VERCEL_TOKEN=... ./scripts/verify-vercel-connection.sh [preview|production]
#
# The script never prints secret values.

set -euo pipefail

target="${1:-preview}"
cli_version="59.3.0"
required_variables=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

failures=()

fail() {
  failures+=("$1")
}

if [[ "$target" != "preview" && "$target" != "production" ]]; then
  printf 'Usage: VERCEL_TOKEN=... %s [preview|production]\n' "$0" >&2
  exit 2
fi

for name in VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID; do
  if [[ -z "${!name:-}" ]]; then
    fail "Missing ${name}. Create it in the repository secrets or export it for this shell."
  fi
done

if [[ "${#failures[@]}" -gt 0 ]]; then
  printf 'Credentials are incomplete:\n' >&2
  printf '  - %s\n' "${failures[@]}" >&2
  exit 1
fi

printf 'Linking to the Vercel project (target: %s)...\n' "$target"
if [[ "$target" == "preview" ]]; then
  pnpm dlx "vercel@${cli_version}" pull --yes --environment=preview --token="$VERCEL_TOKEN"
else
  pnpm dlx "vercel@${cli_version}" pull --yes --environment=production --token="$VERCEL_TOKEN"
fi

environment_file=".vercel/.env.${target}.local"

if [[ ! -f "$environment_file" ]]; then
  printf 'Vercel did not write %s. Check the project link and token scope.\n' "$environment_file" >&2
  exit 1
fi

missing=()

while IFS= read -r name; do
  if [[ -z "${!name:-}" ]]; then
    missing+=("$name")
  fi
done < <(node --env-file="$environment_file" -e '
  for (const name of process.argv.slice(1)) {
    if (!process.env[name]?.trim()) {
      process.stdout.write(`${name}\n`)
    }
  }
' "${required_variables[@]}")

if [[ "${#missing[@]}" -gt 0 ]]; then
  printf 'Missing Vercel environment variable(s) for %s: %s\n' "$target" "${missing[*]}" >&2
  printf 'Add them in Vercel > Project Settings > Environment Variables > %s.\n' "$target" >&2
  exit 1
fi

node --env-file="$environment_file" -e '
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url.startsWith("https://")) {
    console.error("NEXT_PUBLIC_SUPABASE_URL must be an https URL.")
    process.exit(1)
  }

  if (url.includes("your-project") || key === "your-publishable-key") {
    console.error("Replace the placeholder Supabase values in Vercel.")
    process.exit(1)
  }

  console.log(`Supabase configuration for ${process.argv[1]} looks usable.`)
' "$target"

printf 'Vercel connection verified. Run `pnpm dlx vercel@%s build` to rehearse the build.\n' "$cli_version"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"

const repositoryRoot = resolve(import.meta.dirname, "..")
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".next-e2e",
  ".vercel",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
])
// Anchor generation mirrors GitHub: keep letters, digits, underscores, and hyphens, drop
// punctuation and symbols (including full-width forms), then join words with hyphens.
const headingPunctuation = /[^\p{L}\p{N} _-]/gu

function collectMarkdownFiles(directory) {
  const files = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...collectMarkdownFiles(join(directory, entry.name)))
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(join(directory, entry.name))
    }
  }

  return files
}

function slugify(heading) {
  const normalized = heading
    .trim()
    .toLowerCase()
    .replace(headingPunctuation, "")
    .replaceAll(" ", "-")
  return normalized.length > 0 ? normalized : "section"
}

function collectAnchors(filePath) {
  const anchors = new Set()
  const seen = new Map()

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const match = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line)

    if (!match) {
      continue
    }

    const base = slugify(match[2].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"))
    const count = seen.get(base) ?? 0

    seen.set(base, count + 1)
    anchors.add(count === 0 ? base : `${base}-${count}`)
  }

  return anchors
}

function parseLinkTarget(rawLink) {
  const withoutTitle = rawLink.trim().split(/\s+/)[0]
  const unwrapped =
    withoutTitle.startsWith("<") && withoutTitle.endsWith(">")
      ? withoutTitle.slice(1, -1)
      : withoutTitle
  const separator = unwrapped.indexOf("#")

  if (separator === -1) {
    return { fragment: null, path: unwrapped }
  }

  return { fragment: unwrapped.slice(separator + 1), path: unwrapped.slice(0, separator) }
}

const problems = []
const markdownFiles = collectMarkdownFiles(repositoryRoot)
const linkPattern = /\[[^\]]*\]\(([^)\n]+)\)/g

for (const filePath of markdownFiles) {
  const content = readFileSync(filePath, "utf8")
  const fileDirectory = resolve(filePath, "..")

  for (const match of content.matchAll(linkPattern)) {
    const rawLink = match[1]

    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(rawLink)) {
      continue
    }

    const { fragment, path } = parseLinkTarget(rawLink)

    if (!path && !fragment) {
      continue
    }

    const targetPath = path ? resolve(fileDirectory, decodeURIComponent(path)) : filePath

    if (!existsSync(targetPath)) {
      problems.push(`${relative(repositoryRoot, filePath)}: missing target ${rawLink}`)
      continue
    }

    if (!fragment || statSync(targetPath).isDirectory()) {
      continue
    }

    if (!collectAnchors(targetPath).has(decodeURIComponent(fragment).toLowerCase())) {
      problems.push(`${relative(repositoryRoot, filePath)}: missing anchor ${rawLink}`)
    }
  }
}

if (problems.length > 0) {
  console.error("Broken documentation links:")
  for (const problem of problems) {
    console.error(`  ${problem}`)
  }
  process.exit(1)
}

console.log(`Checked ${markdownFiles.length} Markdown files, all links resolve.`)

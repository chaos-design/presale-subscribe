import { chromium } from "@playwright/test"

/** 编辑器输入延迟 A/B。用法: node scripts/ab-editor.mjs <baselineUrl> <candidateUrl> [rounds] */
const baseline = process.argv[2]
const candidate = process.argv[3]
const rounds = Number(process.argv[4] ?? 3)
const browser = await chromium.launch()

async function typing(base) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const page = await context.newPage()
  await page.goto(`${base}/dashboard/campaigns/demo-launch/edit`, { waitUntil: "networkidle" })
  await page.waitForTimeout(2500)
  const cdp = await context.newCDPSession(page)
  await cdp.send("Performance.enable")
  const readMetrics = async () => {
    const { metrics: m } = await cdp.send("Performance.getMetrics")
    return Object.fromEntries(m.map((x) => [x.name, x.value]))
  }
  const a = await readMetrics()
  const out = await page.evaluate(async () => {
    const el = document.querySelector('textarea[name="title"]')
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set
    let text = ""
    const lat = []
    let writes = 0
    const obs = new MutationObserver((rs) => {
      writes += rs.length
    })
    obs.observe(document.body, {
      attributes: true,
      subtree: true,
      childList: true,
      characterData: true,
    })
    for (let i = 0; i < 30; i++) {
      text += "A"
      const t0 = performance.now()
      setter.call(el, text)
      el.dispatchEvent(new Event("input", { bubbles: true }))
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      lat.push(performance.now() - t0)
    }
    obs.disconnect()
    lat.sort((x, y) => x - y)
    return {
      median: Math.round(lat[Math.floor(lat.length / 2)]),
      p95: Math.round(lat[Math.floor(lat.length * 0.95)]),
      writesPerKey: Math.round(writes / 30),
      domNodes: document.querySelectorAll("*").length,
      campaignPages: document.querySelectorAll(".campaign-page").length,
    }
  })
  const b = await readMetrics()
  await context.close()
  return {
    ...out,
    recalcMs: Math.round(((b.RecalcStyleDuration - a.RecalcStyleDuration) * 1000) / 30),
    scriptMs: Math.round(((b.ScriptDuration - a.ScriptDuration) * 1000) / 30),
  }
}

const data = { baseline: [], candidate: [] }
for (let i = 0; i < rounds; i++) {
  const order = i % 2 === 0 ? ["baseline", "candidate"] : ["candidate", "baseline"]
  for (const w of order) {
    data[w].push(await typing(w === "baseline" ? baseline : candidate))
  }
}

const med = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}
const keys = ["median", "p95", "recalcMs", "scriptMs", "writesPerKey", "domNodes", "campaignPages"]
console.log(`\n编辑器输入 · ${rounds} 轮交错，取中位数\n`)
console.log(`${"指标".padEnd(16)}${"main".padStart(10)}${"branch".padStart(10)}`)
for (const k of keys) {
  const b = med(data.baseline.map((r) => r[k]))
  const c = med(data.candidate.map((r) => r[k]))
  const delta = b ? `${(((c - b) / b) * 100).toFixed(0)}%` : "n/a"
  console.log(`${k.padEnd(16)}${String(b).padStart(10)}${String(c).padStart(10)}   Δ=${delta}`)
}
await browser.close()

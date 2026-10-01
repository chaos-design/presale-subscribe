import { expect, type Locator, test } from "@playwright/test"

async function expectTooltipNotClipped(chart: Locator, targetSelector: string) {
  const target = chart.locator(targetSelector).first()
  await target.scrollIntoViewIfNeeded()
  const hoverPoint = await target.evaluate((element) => {
    const bounds = element.getBoundingClientRect()

    for (let row = 1; row < 10; row += 1) {
      for (let column = 1; column < 10; column += 1) {
        const x = bounds.left + (bounds.width * column) / 10
        const y = bounds.top + (bounds.height * row) / 10
        const hit = document.elementFromPoint(x, y)

        if (hit === element || element.contains(hit)) {
          return { x, y }
        }
      }
    }

    return { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
  })
  await chart.page().mouse.move(hoverPoint.x, hoverPoint.y)

  const tooltip = chart.locator(".recharts-tooltip-wrapper")
  await expect(tooltip).toBeVisible()

  const metrics = await tooltip.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const clippedBy: string[] = []
    let ancestor = element.parentElement

    while (ancestor && ancestor !== document.documentElement) {
      const styles = getComputedStyle(ancestor)
      const ancestorBounds = ancestor.getBoundingClientRect()
      const clipsX = ["auto", "clip", "hidden", "scroll"].includes(styles.overflowX)
      const clipsY = ["auto", "clip", "hidden", "scroll"].includes(styles.overflowY)

      if (
        (clipsX && (bounds.left < ancestorBounds.left || bounds.right > ancestorBounds.right)) ||
        (clipsY && (bounds.top < ancestorBounds.top || bounds.bottom > ancestorBounds.bottom))
      ) {
        clippedBy.push(ancestor.getAttribute("data-slot") ?? ancestor.className)
      }

      ancestor = ancestor.parentElement
    }

    const chartBounds = element.closest('[data-slot="chart"]')?.getBoundingClientRect()
    return {
      clippedBy,
      escapesChart:
        chartBounds !== undefined &&
        (bounds.top < chartBounds.top ||
          bounds.right > chartBounds.right ||
          bounds.bottom > chartBounds.bottom ||
          bounds.left < chartBounds.left),
      fitsViewportWidth: bounds.left >= 0 && bounds.right <= window.innerWidth,
      zIndex: Number.parseInt(getComputedStyle(element).zIndex, 10),
    }
  })

  expect(metrics.clippedBy).toEqual([])
  expect(metrics.fitsViewportWidth).toBe(true)
  expect(metrics.zIndex).toBeGreaterThanOrEqual(50)
  return metrics
}

test("analyzes traffic, conversion, and application responses", async ({ page }, testInfo) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard/analytics?days=30")

  await expect(page.getByRole("heading", { name: "项目数据，逐层拆解。" })).toBeVisible()
  await expect(page.getByRole("combobox", { name: "选择分析项目" })).toContainText(
    "Ahead 2.0 功能预告"
  )
  await expect(page.locator(".analytics-metrics > div")).toHaveCount(6)
  await expect(page.getByRole("button", { name: "最近 30 天" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  await expect(page.getByRole("tab")).toHaveCount(5)
  await expect(page.getByRole("heading", { name: "关键维度快照" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "逐日表现" })).toHaveCount(0)
  await expect(page.locator(".analytics-trend-summary > div")).toHaveCount(4)
  await expect(page.getByText("访问峰值", { exact: true })).toBeVisible()
  await expect(page.locator('[data-slot="chart"] svg').first()).toBeVisible()
  expect(await page.locator('[data-slot="chart"] path').count()).toBeGreaterThanOrEqual(3)
  await expectTooltipNotClipped(page.locator('[data-slot="chart"]').first(), ".recharts-area-area")

  const desktopDensity = await page.evaluate(() => {
    const headerBottom = document.querySelector(".dashboard-header")?.getBoundingClientRect().bottom
    const pageTop = document.querySelector(".analytics-page")?.getBoundingClientRect().top
    const menuHeights = Array.from(
      document.querySelectorAll<HTMLElement>(".dashboard-sidebar-menu-button")
    ).map((item) => item.getBoundingClientRect().height)

    return {
      contentTopGap:
        typeof headerBottom === "number" && typeof pageTop === "number"
          ? pageTop - headerBottom
          : Number.POSITIVE_INFINITY,
      maxMenuHeight: Math.max(0, ...menuHeights),
    }
  })

  expect(desktopDensity.contentTopGap).toBeLessThanOrEqual(50)
  expect(desktopDensity.maxMenuHeight).toBeLessThanOrEqual(42)

  await page.screenshot({
    path: testInfo.outputPath("analytics-overview-desktop.png"),
    fullPage: true,
  })

  await page.getByRole("tab", { name: "来源与设备" }).click()
  await expect(page.getByText("访问来源", { exact: true })).toBeVisible()
  await expect(page.getByText("设备构成", { exact: true })).toBeVisible()
  const deviceLabelMetrics = await page
    .locator(".analytics-device-content dt")
    .first()
    .evaluate((label) => ({
      flexShrink: getComputedStyle(label).flexShrink,
      width: label.getBoundingClientRect().width,
    }))
  expect(deviceLabelMetrics.flexShrink).toBe("0")
  expect(deviceLabelMetrics.width).toBeGreaterThanOrEqual(68)
  const deviceCompositionLayout = await page
    .locator(".analytics-device-content")
    .evaluate((content) => {
      const chartBounds = content.querySelector('[data-slot="chart"]')?.getBoundingClientRect()
      const detailsBounds = content.querySelector("dl")?.getBoundingClientRect()

      return {
        chartAboveDetails:
          chartBounds && detailsBounds ? chartBounds.bottom <= detailsBounds.top : false,
      }
    })
  expect(deviceCompositionLayout.chartAboveDetails).toBe(true)
  await expectTooltipNotClipped(
    page.locator(".analytics-device-content [data-slot='chart']"),
    ".recharts-sector"
  )

  await page.getByRole("tab", { name: "行为与地域" }).click()
  await expect(page.getByText("平均有效停留", { exact: true })).toBeVisible()
  await expect(page.getByText("地域分布", { exact: true })).toBeVisible()
  await expect(page.getByText("上海", { exact: false }).first()).toBeVisible()
  await expect(page.locator(".analytics-location-share-chart svg")).toBeVisible()
  await expect(page.locator(".analytics-device-share-chart svg")).toBeVisible()
  expect(
    await page.locator(".analytics-location-share-chart .recharts-rectangle").count()
  ).toBeGreaterThan(0)
  expect(
    await page.locator(".analytics-device-share-chart .recharts-rectangle").count()
  ).toBeGreaterThan(0)
  const locationTooltip = await expectTooltipNotClipped(
    page.locator(".analytics-location-share-chart"),
    ".recharts-wrapper"
  )
  expect(locationTooltip.escapesChart).toBe(true)
  const deviceTooltip = await expectTooltipNotClipped(
    page.locator(".analytics-device-share-chart"),
    ".recharts-wrapper"
  )
  expect(deviceTooltip.escapesChart).toBe(true)

  await page.screenshot({
    path: testInfo.outputPath("analytics-behavior-desktop.png"),
    fullPage: true,
  })

  await page.getByRole("tab", { name: "转化明细" }).click()
  await expect(page.getByRole("heading", { name: "项目转化明细" })).toBeVisible()
  await expect(page.getByText("独立访客", { exact: true }).last()).toBeVisible()
  await expect(page.getByText("访问会话", { exact: true })).toBeVisible()
  await expect(page.getByText("会话申请率", { exact: true })).toBeVisible()
  await expect(page.getByText("累计申请", { exact: true })).toBeVisible()

  await page.screenshot({
    path: testInfo.outputPath("analytics-conversion-desktop.png"),
    fullPage: true,
  })

  await page.getByRole("tab", { name: "受众与需求" }).click()
  await expect(page.getByRole("heading", { name: "问卷回答分布" })).toBeVisible()
  await expect(page.getByText("你最想先看到哪一部分？")).toBeVisible()
  await expect(page.getByText("申请邮箱域名")).toBeVisible()
  await expect(page.getByText("协作流程")).toBeVisible()
  await expect(page.locator(".analytics-domain-chart svg")).toBeVisible()
  await expect(page.locator(".analytics-question-chart")).toHaveCount(3)
  await expect(page.locator(".analytics-question-chart svg").first()).toBeVisible()
  await expectTooltipNotClipped(page.locator(".analytics-domain-chart"), ".recharts-rectangle")
  await expectTooltipNotClipped(
    page.locator(".analytics-question-chart").first(),
    ".recharts-rectangle"
  )

  await page.screenshot({
    path: testInfo.outputPath("analytics-applications-desktop.png"),
    fullPage: true,
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  const mobileMetrics = await page.locator(".analytics-page").evaluate((analyticsPage) => {
    const headingCopy = analyticsPage.querySelector(".dashboard-page-heading > div")
    const range = analyticsPage.querySelector('[data-slot="toggle-group"]')
    const firstMetric = analyticsPage.querySelector(".analytics-metrics > div")
    const firstTrendSummary = analyticsPage.querySelector(".analytics-trend-summary > div")

    return {
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      headingBottom: headingCopy?.getBoundingClientRect().bottom ?? 0,
      rangeTop: range?.getBoundingClientRect().top ?? 0,
      firstMetricWidth: firstMetric?.getBoundingClientRect().width ?? 0,
      firstTrendSummaryWidth: firstTrendSummary?.getBoundingClientRect().width ?? 0,
    }
  })

  expect(mobileMetrics.noHorizontalOverflow).toBe(true)
  expect(mobileMetrics.rangeTop).toBeGreaterThanOrEqual(mobileMetrics.headingBottom)
  expect(mobileMetrics.firstMetricWidth).toBeGreaterThanOrEqual(150)
  expect(mobileMetrics.firstTrendSummaryWidth).toBeGreaterThanOrEqual(130)

  await page.screenshot({
    path: testInfo.outputPath("analytics-overview-mobile.png"),
    fullPage: true,
  })

  await page.getByRole("tab", { name: "行为与地域" }).click()
  await expect(page.locator(".analytics-location-share-chart svg")).toBeVisible()
  await expect(page.locator(".analytics-device-share-chart svg")).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
  await expectTooltipNotClipped(
    page.locator(".analytics-location-share-chart"),
    ".recharts-wrapper"
  )

  await page.screenshot({
    path: testInfo.outputPath("analytics-behavior-mobile.png"),
    fullPage: true,
  })

  await page.getByRole("tab", { name: "受众与需求" }).click()
  await expect(page.getByText("哪些信息会帮助你判断是否加入首批体验？")).toBeVisible()
  await expectTooltipNotClipped(
    page.locator(".analytics-question-chart").first(),
    ".recharts-rectangle"
  )

  await page.screenshot({
    path: testInfo.outputPath("analytics-applications-mobile.png"),
    fullPage: true,
  })

  await page.getByRole("combobox", { name: "选择分析项目" }).click()
  await page.getByRole("option", { name: "开发者 API 内测" }).click()
  await expect(page).toHaveURL(/project=demo-signal/)
  await expect(page.getByRole("combobox", { name: "选择分析项目" })).toContainText(
    "开发者 API 内测"
  )
  await expect(page.getByText("区间内还没有问卷回答")).toBeVisible()

  expect(pageErrors).toEqual([])
})

test("uses a compact 4:6 layout for published performance", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard")

  const performance = page.locator(".dashboard-performance")
  await expect(performance).toBeVisible()
  await expect(page.getByText("LIVE RESPONSE / PUBLISHED ONLY")).toHaveCount(0)

  const layout = await performance.evaluate((section) => {
    const header = section.querySelector(".dashboard-performance-header")
    const copy = header?.querySelector("div")
    const action = header?.querySelector("a")
    const title = header?.querySelector("h2")
    const ranking = section.querySelector("ol")
    const headerBounds = header?.getBoundingClientRect()
    const copyBounds = copy?.getBoundingClientRect()
    const actionBounds = action?.getBoundingClientRect()
    const rankingBounds = ranking?.getBoundingClientRect()
    const titleBounds = title?.getBoundingClientRect()
    const titleStyles = title ? getComputedStyle(title) : null

    return {
      actionBelowCopy: copyBounds && actionBounds ? actionBounds.top >= copyBounds.bottom : false,
      copyLeftOfRanking:
        headerBounds && rankingBounds ? headerBounds.right <= rankingBounds.left : false,
      paddingTop: Number.parseFloat(getComputedStyle(section).paddingTop),
      rightToLeftRatio:
        headerBounds && rankingBounds ? rankingBounds.width / headerBounds.width : 0,
      titleFitsColumn: title ? title.scrollWidth <= title.clientWidth : false,
      titleIsSingleLine:
        titleBounds && titleStyles
          ? titleBounds.height <= Number.parseFloat(titleStyles.lineHeight) + 1
          : false,
    }
  })

  expect(layout.copyLeftOfRanking).toBe(true)
  expect(layout.rightToLeftRatio).toBeCloseTo(1.5, 1)
  expect(layout.actionBelowCopy).toBe(true)
  expect(layout.paddingTop).toBeLessThanOrEqual(48)
  expect(layout.titleFitsColumn).toBe(true)
  expect(layout.titleIsSingleLine).toBe(true)

  await performance.screenshot({
    path: testInfo.outputPath("dashboard-published-performance.png"),
  })

  await page.setViewportSize({ width: 390, height: 844 })
  const mobileLayout = await performance.evaluate((section) => {
    const headerBounds = section
      .querySelector(".dashboard-performance-header")
      ?.getBoundingClientRect()
    const rankingBounds = section.querySelector("ol")?.getBoundingClientRect()

    return {
      headerAboveRanking:
        headerBounds && rankingBounds ? headerBounds.bottom <= rankingBounds.top : false,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    }
  })

  expect(mobileLayout.headerAboveRanking).toBe(true)
  expect(mobileLayout.noHorizontalOverflow).toBe(true)
})

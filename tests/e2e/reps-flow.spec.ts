import { expect, type Locator, test } from "@playwright/test"

import { productConfig } from "@/lib/product-config"

async function readColorBrightness(locator: Locator) {
  const value = await locator.evaluate((element) => getComputedStyle(element).color)
  const channels = value.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0]
  return (channels[0] + channels[1] + channels[2]) / 3
}

test("opens the campaign workspace and editor in demo mode", async ({ page }) => {
  const pageErrors: string[] = []
  page.on("pageerror", (error) => pageErrors.push(error.message))

  await page.goto("/")

  await expect(page.getByRole("heading", { name: "REPS" })).toBeVisible()
  const homeFooter = page.locator('[data-home-footer="product"]')
  await expect(homeFooter).toContainText("MADE WITH REPS")
  await expect(homeFooter).toContainText("开源功能预告与预约订阅系统")
  await expect(page.getByRole("link", { name: "在 GitHub 上查看 REPS" })).toHaveAttribute(
    "href",
    productConfig.productCredit.githubUrl
  )

  // 首页 Hero 恒为深色，顶部链接在默认与悬停状态下都必须保持可读。
  const previewLink = page.getByRole("link", { name: "查看线上示例" })
  expect(await readColorBrightness(previewLink)).toBeGreaterThan(200)

  await previewLink.hover()
  // Hero 入场动画会让元素位移，悬停样式需要轮询等待其真正生效。
  await expect
    .poll(
      async () =>
        previewLink.evaluate(
          (element) => getComputedStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)"
        ),
      { timeout: 5_000 }
    )
    .toBe(true)
  expect(await readColorBrightness(previewLink)).toBeGreaterThan(200)

  await page
    .getByRole("link", { name: /查看演示工作台|进入工作台|登录/ })
    .first()
    .click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole("heading", { name: "每一次发布，都从这里进入稳定轨道。" })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "项目", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "数据分析", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "模板", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "打开账号菜单" })).toBeVisible()
  await expect(page.locator(".dashboard-header")).not.toContainText("Every release, a way in.")
  const searchBox = await page.getByRole("button", { name: "搜索工作区" }).boundingBox()
  expect(searchBox?.width ?? 0).toBeLessThanOrEqual(224)
  expect(searchBox?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(500)
  const sidebarHeader = page.locator('[data-slot="sidebar-header"]')
  const sidebarHeaderTrigger = page.getByRole("button", { name: "收起或展开侧栏" })
  await expect(sidebarHeaderTrigger).toBeVisible()
  const [brandBox, triggerBox] = await Promise.all([
    sidebarHeader.getByRole("link", { name: "REPS 首页" }).boundingBox(),
    sidebarHeaderTrigger.boundingBox(),
  ])
  expect(triggerBox?.x ?? 0).toBeGreaterThan((brandBox?.x ?? 0) + (brandBox?.width ?? 0))
  const expandedLeftInset = await sidebarHeaderTrigger.evaluate((trigger) => {
    const sidebar = document.querySelector('[data-slot="sidebar-container"]')
    return trigger.getBoundingClientRect().left - (sidebar?.getBoundingClientRect().right ?? 0)
  })
  expect(expandedLeftInset).toBeGreaterThanOrEqual(8)
  expect(expandedLeftInset).toBeLessThanOrEqual(20)
  const headerAlignment = await page.locator(".dashboard-shell").evaluate((shell) => {
    const sidebarHeaderBox = shell
      .querySelector('[data-slot="sidebar-header"]')
      ?.getBoundingClientRect()
    const headerBox = shell.querySelector(".dashboard-header")?.getBoundingClientRect()

    return {
      bottomDifference: Math.abs((sidebarHeaderBox?.bottom ?? 0) - (headerBox?.bottom ?? 0)),
      heightDifference: Math.abs((sidebarHeaderBox?.height ?? 0) - (headerBox?.height ?? 0)),
    }
  })
  expect(headerAlignment.bottomDifference).toBeLessThan(1)
  expect(headerAlignment.heightDifference).toBeLessThan(1)

  await page.keyboard.press("Meta+k")
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByPlaceholder("搜索页面或操作...").fill("午夜首映")
  await expect(page.getByRole("option", { name: /午夜首映/ })).toBeVisible()
  await page.keyboard.press("Escape")

  const sidebar = page.locator('[data-slot="sidebar-container"]')
  await page.getByRole("button", { name: "收起或展开侧栏" }).click()
  await expect
    .poll(() => sidebar.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThanOrEqual(77)
  await expect(sidebarHeaderTrigger).toHaveAttribute("aria-expanded", "false")
  const collapsedMenuAlignment = await page
    .getByRole("link", { name: "项目", exact: true })
    .evaluate((link) => {
      const icon = link.querySelector("svg")?.getBoundingClientRect()
      const bounds = link.getBoundingClientRect()

      return {
        centerDifference: Math.abs(
          (icon?.left ?? 0) + (icon?.width ?? 0) / 2 - (bounds.left + bounds.width / 2)
        ),
      }
    })
  expect(collapsedMenuAlignment.centerDifference).toBeLessThan(1)
  await page.getByRole("button", { name: "收起或展开侧栏" }).click()

  await page.getByRole("button", { name: "项目操作" }).first().click()
  await expect(page.getByRole("menuitem", { name: "编辑配置" })).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "打开账号菜单" }).click()
  await expect(page.getByRole("menuitem", { name: "账号设置" })).toBeVisible()
  await page.keyboard.press("Escape")
  expect(pageErrors).toEqual([])

  const campaignCard = page.locator(".dashboard-project-card").first()
  await expect(campaignCard).toBeVisible()
  await expect(campaignCard).toHaveJSProperty("tagName", "DIV")
  await expect(campaignCard).not.toHaveAttribute("role")
  await expect(campaignCard).not.toHaveAttribute("tabindex")
  await expect(campaignCard.locator("a.dashboard-project-card-link")).toHaveCount(0)
  await expect(campaignCard.locator("button.dashboard-project-card-link")).toHaveCount(0)
  const metricSpacing = await campaignCard.evaluate((card) => {
    const metricValue = card.querySelector(":scope > dl dd")
    const metrics = card.querySelector(":scope > dl")
    const footer = card.querySelector(":scope > footer")

    return {
      contentBottom:
        (metrics?.getBoundingClientRect().bottom ?? 0) -
        (metricValue?.getBoundingClientRect().bottom ?? 0),
      footerGap:
        (footer?.getBoundingClientRect().top ?? 0) - (metrics?.getBoundingClientRect().bottom ?? 0),
    }
  })
  expect(metricSpacing.contentBottom).toBeLessThan(20)
  expect(metricSpacing.footerGap).toBeLessThan(2)
  const projectVisual = page.locator(".dashboard-project-visual").first()
  await expect(projectVisual.locator(".campaign-page")).toHaveCount(1)
  await expect(projectVisual.locator("img")).toHaveCount(0)
  await campaignCard.click()
  await expect(page).toHaveURL(/\/dashboard\/campaigns\/demo-launch\/subscribers$/)

  await page.goto("/dashboard")
  await page.locator(".dashboard-project-card").filter({ hasText: "夏季编辑精选" }).click()
  await expect(page).toHaveURL(/\/dashboard\/campaigns\/demo-editorial\/edit$/)

  await page.goto("/dashboard")
  await page.getByRole("link", { name: "编辑" }).first().click()
  await expect(page).toHaveURL(/\/dashboard\/campaigns\/demo-launch\/edit$/)
  await expect(page.getByRole("button", { name: "保存草稿" })).toBeVisible()
  await expect(page.getByRole("button", { name: "发布活动" })).toBeVisible()
  await expect(page.getByLabel("主标题")).toHaveValue("下一次更新，先让你知道")

  const templateButtons = page.getByLabel("选择全页模板").getByRole("button")
  const templateButtonMetrics = await templateButtons.evaluateAll((buttons) =>
    buttons.slice(0, 4).map((button) => ({
      height: button.getBoundingClientRect().height,
      noHorizontalOverflow: button.scrollWidth <= button.clientWidth,
    }))
  )
  expect(new Set(templateButtonMetrics.map((metric) => metric.height)).size).toBe(1)
  expect(templateButtonMetrics[0]?.height).toBe(160)
  expect(templateButtonMetrics.every((metric) => metric.noHorizontalOverflow)).toBe(true)
  const templatePreviewMetrics = await page
    .getByLabel("选择全页模板")
    .locator(".campaign-template-thumbnail")
    .evaluateAll((thumbnails) => {
      const readyThumbnails = thumbnails.filter(
        (thumbnail) => thumbnail.getAttribute("data-ready") === "true"
      )

      return {
        readyCount: readyThumbnails.length,
        pageCount: readyThumbnails.filter((thumbnail) => thumbnail.querySelector(".campaign-page"))
          .length,
        completePageCount: readyThumbnails.filter(
          (thumbnail) =>
            thumbnail.querySelector(".campaign-page-hero") &&
            thumbnail.querySelector(".campaign-page-highlights") &&
            thumbnail.querySelector(".campaign-page-timeline") &&
            thumbnail.querySelector(".campaign-page-closing")
        ).length,
        uniqueTitles: new Set(
          readyThumbnails.map((thumbnail) =>
            thumbnail.querySelector(".campaign-public-title")?.textContent?.trim()
          )
        ).size,
        widthFilled: readyThumbnails.every((thumbnail) => {
          const page = thumbnail.querySelector(".campaign-template-thumbnail-page")
          return (
            page !== null &&
            Math.abs(page.getBoundingClientRect().width - thumbnail.clientWidth) < 1
          )
        }),
        scrollableCount: readyThumbnails.filter(
          (thumbnail) => thumbnail.scrollHeight > thumbnail.clientHeight
        ).length,
      }
    })
  expect(templatePreviewMetrics.readyCount).toBeGreaterThan(0)
  expect(templatePreviewMetrics.pageCount).toBe(templatePreviewMetrics.readyCount)
  expect(templatePreviewMetrics.completePageCount).toBe(templatePreviewMetrics.readyCount)
  expect(templatePreviewMetrics.uniqueTitles).toBe(templatePreviewMetrics.readyCount)
  expect(templatePreviewMetrics.widthFilled).toBe(true)
  expect(templatePreviewMetrics.scrollableCount).toBe(templatePreviewMetrics.readyCount)
  const selectedTemplateMarker = page
    .getByRole("button", { name: "轨道首发：沉浸影像与超大标题" })
    .locator(".campaign-template-picker-check")
  await expect(selectedTemplateMarker).toHaveAttribute("data-selected", "true")
  await page.locator("#campaign-surface").scrollIntoViewIfNeeded()
  await expect(page.getByRole("link", { name: "视觉", exact: true })).toHaveAttribute(
    "aria-current",
    "location"
  )
})

test("uses the template library and simplified project creation flow", async ({ page }) => {
  await page.goto("/dashboard")

  await page.getByRole("link", { name: "模板", exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard\/templates$/)
  await expect(page.getByRole("heading", { name: "模板库" })).toBeVisible()
  const playgroundCard = page.getByText("彩色游乐场", { exact: true }).locator("..").locator("..")
  await expect(playgroundCard).toContainText("原色积木与轻快节奏")
  const firstTemplateCard = page.locator(".dashboard-template-library > article").first()
  await expect(firstTemplateCard.getByRole("img", { name: "轨道首发模板缩略图" })).toBeVisible()
  await expect(firstTemplateCard.locator(".campaign-page")).toHaveCount(1)
  await expect(firstTemplateCard.locator(".campaign-page-hero")).toHaveCount(1)
  await expect(firstTemplateCard.locator(".campaign-page-highlights")).toHaveCount(1)
  await expect(firstTemplateCard.locator(".campaign-page-timeline")).toHaveCount(1)
  await expect(firstTemplateCard.locator(".campaign-page-closing")).toHaveCount(1)
  await expect(firstTemplateCard.locator(".campaign-template-thumbnail")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await expect(firstTemplateCard.getByRole("button", { name: /展开|收起/ })).toHaveCount(0)

  await page.goto("/dashboard/new?template=playground")
  await expect(page.getByRole("heading", { name: "创建项目" })).toBeVisible()
  await expect(page.locator('input[name="template"]')).toHaveValue("playground")
  await expect(
    page.getByRole("button", { name: "彩色游乐场：原色积木与轻快节奏" })
  ).toHaveAttribute("aria-pressed", "true")
  const creationTemplateMetrics = await page
    .getByLabel("选择全页模板")
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.slice(0, 4).map((button) => ({
        height: button.getBoundingClientRect().height,
        noHorizontalOverflow: button.scrollWidth <= button.clientWidth,
      }))
    )
  expect(creationTemplateMetrics.every((metric) => Math.abs(metric.height - 160) < 0.01)).toBe(true)
  expect(creationTemplateMetrics.every((metric) => metric.noHorizontalOverflow)).toBe(true)
  const creationLayout = page.locator(".new-campaign-layout")
  const creationMetrics = await creationLayout.evaluate((layout) => {
    const controls = layout.querySelector(".new-campaign-controls")
    const templateList = layout.querySelector(".new-campaign-template-list")
    const previewPane = layout.querySelector(".new-campaign-preview-pane")
    const previewCanvas = layout.querySelector(".new-campaign-preview-canvas")

    return {
      pageScrollable: document.documentElement.scrollHeight > window.innerHeight,
      templateOverflowY: templateList ? getComputedStyle(templateList).overflowY : "",
      templateScrollable: templateList
        ? templateList.scrollHeight > templateList.clientHeight
        : false,
      previewPaneOverflowY: previewPane ? getComputedStyle(previewPane).overflowY : "",
      previewOverflowY: previewCanvas ? getComputedStyle(previewCanvas).overflowY : "",
      previewScrollable: previewCanvas
        ? previewCanvas.scrollHeight > previewCanvas.clientHeight
        : false,
      previewIsWider:
        Boolean(controls) &&
        Boolean(previewPane) &&
        (previewPane?.getBoundingClientRect().width ?? 0) >
          (controls?.getBoundingClientRect().width ?? 0),
      templatePreviewCount: layout.querySelectorAll(".new-campaign-template-swatch").length,
    }
  })
  expect(creationMetrics).toEqual({
    pageScrollable: false,
    templateOverflowY: "auto",
    templateScrollable: true,
    previewPaneOverflowY: "hidden",
    previewOverflowY: "auto",
    previewScrollable: true,
    previewIsWider: true,
    templatePreviewCount: 16,
  })

  const previewCanvas = page.locator(".new-campaign-preview-canvas")
  const progress = page.locator(".new-campaign-browser-progress")
  const progressBefore = await progress.evaluate(
    (element) => new DOMMatrix(getComputedStyle(element).transform).a
  )
  await previewCanvas.evaluate((element) => {
    element.scrollTop = Math.min(900, element.scrollHeight - element.clientHeight)
    element.dispatchEvent(new Event("scroll"))
  })
  await expect
    .poll(() =>
      progress.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a)
    )
    .toBeGreaterThan(progressBefore)

  await page.getByLabel("项目名称").fill("社区创意工具发布")
  await page.getByRole("button", { name: "创建并进入编辑" }).click()
  await expect(page).toHaveURL(/\/dashboard\/campaigns\/demo-launch\/edit$/)
})

test("cycles through page systems from the home carousel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  await page.getByRole("link", { name: "浏览预告样式" }).click()
  await expect(page.getByRole("heading", { name: "轨道首发" })).toBeVisible()

  const console = page.locator(".home-page-system-console")
  await expect(console.getByRole("img", { name: "轨道首发模板缩略图" })).toBeVisible()
  await page.locator('section[aria-label="页面系统"]').hover()
  await expect(console.getByRole("button", { name: "继续自动轮播" })).toBeVisible()
  const activePagePreview = console.locator(".home-template-cover .campaign-page")
  await expect(activePagePreview).toHaveCount(1)
  await expect(activePagePreview.locator(".campaign-page-hero")).toHaveCount(1)
  await expect(activePagePreview.locator(".campaign-page-highlights")).toHaveCount(1)
  await expect(activePagePreview.locator(".campaign-page-timeline")).toHaveCount(1)
  await expect(activePagePreview.locator(".campaign-page-closing")).toHaveCount(1)
  const activePreviewFrame = console.locator(".home-template-cover")
  const activePreviewMetrics = await activePreviewFrame.evaluate((frame) => {
    const page = frame.querySelector(".campaign-template-thumbnail-page")
    return {
      overflowY: getComputedStyle(frame).overflowY,
      widthDifference: Math.abs((page?.getBoundingClientRect().width ?? 0) - frame.clientWidth),
      scrollable: frame.scrollHeight > frame.clientHeight,
    }
  })
  expect(activePreviewMetrics).toEqual({
    overflowY: "auto",
    widthDifference: 0,
    scrollable: true,
  })
  await activePreviewFrame.evaluate((frame) => {
    frame.scrollTop = 160
  })
  await expect
    .poll(() => activePreviewFrame.evaluate((frame) => frame.scrollTop))
    .toBeGreaterThan(0)
  await expect(console.getByText(/以沉浸影像与超大标题建立第一印象/)).toBeVisible()
  await expect(console.locator(".home-template-strip")).toHaveCount(0)
  const templateStrip = page.locator(".home-template-strip")
  await expect(templateStrip).toBeVisible()
  const stripMetrics = await templateStrip
    .locator('[data-slot="scroll-area-viewport"]')
    .evaluate((viewport) => ({
      clientWidth: viewport.clientWidth,
      scrollWidth: viewport.scrollWidth,
    }))
  expect(stripMetrics.scrollWidth).toBeGreaterThan(stripMetrics.clientWidth)
  const scrollbarMetrics = await templateStrip.evaluate((strip) => ({
    trackHeight:
      strip.querySelector('[data-slot="scroll-area-scrollbar"]')?.getBoundingClientRect().height ??
      0,
    thumbHeight:
      strip.querySelector('[data-slot="scroll-area-thumb"]')?.getBoundingClientRect().height ?? 0,
  }))
  expect(scrollbarMetrics).toEqual({
    trackHeight: 4,
    thumbHeight: 2,
  })

  await page.getByRole("button", { name: "下一套页面系统" }).click()
  await expect(page.getByRole("heading", { name: "未来档案" })).toBeVisible()
  await expect(page.getByRole("button", { name: "显示未来档案" })).toHaveAttribute(
    "aria-current",
    "true"
  )
  await expect(console.getByRole("img", { name: "未来档案模板缩略图" })).toBeVisible()
  await expect.poll(() => activePreviewFrame.evaluate((frame) => frame.scrollTop)).toBe(0)
  await page.getByRole("button", { name: "显示午夜首映" }).click()
  await expect(page.getByRole("heading", { name: "午夜首映" })).toBeVisible()
  await expect(page.getByRole("button", { name: "显示午夜首映" })).toHaveAttribute(
    "aria-current",
    "true"
  )
  await expect
    .poll(() =>
      page
        .locator('.home-template-strip [data-slot="scroll-area-viewport"]')
        .evaluate((viewport) => viewport.scrollLeft)
    )
    .toBeGreaterThan(0)
})

test("renders a published campaign and accepts a demo reservation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/p/reps-release-preview")

  await expect(page.getByRole("heading", { name: "下一次更新，先让你知道" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "为真正关心更新的人准备" })).toBeVisible()
  await page.locator(".campaign-questionnaire-title").scrollIntoViewIfNeeded()
  await expect(page.getByRole("heading", { name: "在抵达之前，留下你的坐标" })).toBeVisible()
  await expect(page.getByRole("checkbox", { name: "开放时间" })).toBeVisible()
  const subscribeForm = page.locator('form.campaign-subscribe[data-template="launch"]')
  await expect(subscribeForm).toBeVisible()
  await expect(subscribeForm).toHaveAttribute("novalidate", "")
  const mobileLayoutMetrics = await page.locator(".campaign-page").evaluate((campaignPage) => {
    const title = campaignPage.querySelector(".campaign-page-hero h1")
    const closing = campaignPage.querySelector(".campaign-page-closing")
    const option = campaignPage.querySelector(".campaign-question-option")
    const emailInput = campaignPage.querySelector(".campaign-subscribe-input")

    return {
      noHorizontalOverflow: campaignPage.scrollWidth <= campaignPage.clientWidth,
      titleFontSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      closingPaddingLeft: closing ? Number.parseFloat(getComputedStyle(closing).paddingLeft) : 0,
      optionHeight: option?.getBoundingClientRect().height ?? 0,
      emailFontSize: emailInput ? Number.parseFloat(getComputedStyle(emailInput).fontSize) : 0,
    }
  })
  expect(mobileLayoutMetrics.noHorizontalOverflow).toBe(true)
  expect(mobileLayoutMetrics.titleFontSize).toBeLessThanOrEqual(43)
  expect(mobileLayoutMetrics.closingPaddingLeft).toBeGreaterThanOrEqual(16)
  expect(mobileLayoutMetrics.optionHeight).toBeGreaterThanOrEqual(44)
  expect(mobileLayoutMetrics.emailFontSize).toBeGreaterThanOrEqual(16)
  const formBorders = await page.locator("form.campaign-subscribe").evaluate((form) => {
    const questionnaire = form.querySelector(".campaign-questionnaire")
    const question = form.querySelector(".campaign-question")
    const option = form.querySelector(".campaign-question-option")
    const answer = form.querySelector(".campaign-question-answer")
    const email = form.querySelector(".campaign-subscribe-field")

    return [questionnaire, question, option, answer, email].map((element) => {
      const style = element ? getComputedStyle(element) : null
      return style
        ? [
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderBottomWidth,
            style.borderLeftWidth,
          ]
        : []
    })
  })
  expect(formBorders.flat()).toEqual(Array(formBorders.flat().length).fill("0px"))
  await expect(page.getByLabel("留下你的邮箱")).toHaveAttribute("required", "")
  await expect(page.locator('input[name="visitorId"]')).not.toHaveValue("")
  await expect(page.locator('input[name="sessionId"]')).not.toHaveValue("")
  await page.getByRole("button", { name: "预约首发通知" }).click()
  await expect(page.locator("[data-sonner-toast]")).toContainText("请完成“你最想先看到哪一部分？”")
  await page.getByRole("radio", { name: "协作流程" }).check()
  await page
    .getByLabel("还有什么，会让这次更新对你更有价值？")
    .fill("希望第一批体验能覆盖跨团队发布。")
  const reservationEmail = page.getByLabel("留下你的邮箱")
  await expect(page.locator(".campaign-subscribe-email-feedback")).toHaveCount(0)
  await reservationEmail.fill("reader@temporary.example")
  await reservationEmail.press("Tab")
  await expect(page.getByText(/请使用 Gmail、Outlook、QQ、163、iCloud/)).toBeVisible()
  await page.getByRole("button", { name: "预约首发通知" }).click()
  await expect(page.getByRole("status")).toHaveCount(0)

  await reservationEmail.fill("reader@gmail.com")
  await page.getByRole("button", { name: "预约首发通知" }).click()

  await expect(page.locator('[data-sonner-toast][data-type="success"]')).toContainText("预约成功")
  await expect(reservationEmail).toHaveValue("")
})

test("previews campaign configuration and copies the published share URL", async ({
  context,
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      this.dataset.playCalls = String(Number(this.dataset.playCalls ?? "0") + 1)
      return Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () {
      this.dataset.pauseCalls = String(Number(this.dataset.pauseCalls ?? "0") + 1)
    }
  })
  await page.addInitScript({
    content: `
      (() => {
        const nativeCreateElement = Document.prototype.createElement;
        Document.prototype.createElement = function(tagName, options) {
          const element = nativeCreateElement.call(this, tagName, options);

          if (String(tagName).toLowerCase() === "video") {
            let currentTime = 0;

            Object.defineProperties(element, {
              currentTime: {
                configurable: true,
                get() {
                  return currentTime;
                },
                set(value) {
                  currentTime = Number(value) || 0;
                  queueMicrotask(() => element.dispatchEvent(new Event("seeked")));
                },
              },
              duration: { configurable: true, get: () => 2 },
              readyState: { configurable: true, get: () => 4 },
              videoHeight: { configurable: true, get: () => 180 },
              videoWidth: { configurable: true, get: () => 320 },
            });

            element.load = function() {
              if (!element.getAttribute("src")) {
                return;
              }

              queueMicrotask(() => {
                element.dispatchEvent(new Event("loadedmetadata"));
                element.dispatchEvent(new Event("loadeddata"));
              });
            };
          }

          return element;
        };

        const nativeGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(contextId, options) {
          const context = nativeGetContext.call(this, contextId, options);

          if (contextId === "2d" && context) {
            context.drawImage = () => {};
          }

          return context;
        };

        HTMLCanvasElement.prototype.toBlob = function(callback, type) {
          callback(new Blob(["poster"], { type: type || "image/png" }));
        };
      })();
    `,
  })
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  const title = "下一代协作界面，即将抵达"
  await page.getByLabel("主标题").fill(title)
  await expect(
    page.locator('[data-preview-device="desktop"] .campaign-preview-title').first()
  ).toContainText(title)
  await expect(
    page.locator('[data-preview-device="desktop"] [data-editor-target="title"]').first()
  ).toHaveAttribute("data-editor-active", "true")
  await page.getByLabel("功能标题").fill("三个关键能力同步开放")
  await page
    .getByLabel("功能正文")
    .fill("完整说明协作、发布和受众管理能力，并明确首批开放范围与时间。")
  await expect(page.locator(".studio-grid").getByText("三个关键能力同步开放")).toBeVisible()
  await expect(page.getByLabel("启用预约问卷")).toBeChecked()
  const emailLabel = "用于接收首发通知的邮箱"
  await page.getByLabel("邮箱标题").fill(emailLabel)
  await expect(
    page.locator('[data-preview-device="desktop"] [data-editor-target="email-label"]').first()
  ).toContainText(emailLabel)
  await page.getByLabel("问卷标题").fill("告诉我们，你在等待什么")
  await page.getByLabel("上传预览视频").setInputFiles("public/ocean.mp4")
  await expect(page.getByText("视频已加载到本地预览")).toBeVisible()
  await expect(page.getByRole("switch", { name: /自动播放预览视频/ })).not.toBeChecked()
  await expect(page.getByRole("switch", { name: /预览视频静音/ })).toBeChecked()
  await page.getByRole("switch", { name: /自动播放预览视频/ }).click()
  await expect(page.getByRole("switch", { name: /预览视频静音/ })).toBeChecked()
  const previewVideo = page
    .locator('[data-preview-device="desktop"] video.campaign-page-video')
    .first()
  await expect(
    page.locator('[data-preview-device="desktop"] .campaign-page-video-section').first()
  ).toBeVisible()
  await expect(previewVideo).toHaveAttribute("controls", "")
  await expect(previewVideo).toHaveAttribute("playsinline", "")
  await expect(previewVideo).toHaveAttribute("src", /^blob:/)
  await expect(previewVideo).toHaveAttribute("poster", /^blob:/)
  await expect(previewVideo).not.toHaveAttribute("autoplay", "")
  await expect(previewVideo.locator("xpath=..")).toHaveAttribute("data-viewport-autoplay", "true")
  await expect
    .poll(() =>
      previewVideo.evaluate((video) => Number((video as HTMLVideoElement).dataset.playCalls ?? "0"))
    )
    .toBeGreaterThan(0)
  const previewScroller = page.locator('[data-preview-device="desktop"] .preview-device-scroll')
  const pauseCallsBeforeLeaving = await previewVideo.evaluate((video) =>
    Number((video as HTMLVideoElement).dataset.pauseCalls ?? "0")
  )
  await previewScroller.evaluate((scroller) => scroller.scrollTo({ top: 0, behavior: "auto" }))
  await expect
    .poll(() =>
      previewVideo.evaluate((video) =>
        Number((video as HTMLVideoElement).dataset.pauseCalls ?? "0")
      )
    )
    .toBeGreaterThan(pauseCallsBeforeLeaving)
  await previewVideo.evaluate((video) => {
    ;(video as HTMLVideoElement).dataset.playCalls = "0"
  })
  await previewVideo.evaluate((video) =>
    video.closest(".campaign-page-video-section")?.scrollIntoView({ block: "center" })
  )
  await expect
    .poll(() =>
      previewVideo.evaluate((video) => Number((video as HTMLVideoElement).dataset.playCalls ?? "0"))
    )
    .toBeGreaterThan(0)
  await expect
    .poll(() =>
      previewVideo.evaluate((element) => {
        const video = element as HTMLVideoElement
        return {
          controls: video.controls,
          canPause: typeof video.pause === "function",
          canPlay: typeof video.play === "function",
          canSeek: "currentTime" in video,
          canSetVolume: "volume" in video,
          canFullscreen: typeof video.requestFullscreen === "function",
        }
      })
    )
    .toEqual({
      controls: true,
      canPause: true,
      canPlay: true,
      canSeek: true,
      canSetVolume: true,
      canFullscreen: true,
    })
  await expect(page.locator('input[name="previewVideo"]')).toHaveValue(/"posterUrl":"blob:/)
  await expect(page.locator('input[name="previewVideo"]')).toHaveValue(/"autoplay":true/)
  await page.getByRole("button", { name: "添加问题" }).click()
  await expect(page.getByText("4 QUESTIONS", { exact: true })).toBeVisible()
  await expect(page.locator('input[name="questionnaire"]')).toHaveValue(/告诉我们，你在等待什么/)
  const desktopSubscription = page
    .locator('[data-preview-device="desktop"] .campaign-subscribe')
    .first()
  const desktopQuestionnaire = page.locator(
    '[data-preview-device="desktop"] [data-preview-questionnaire]'
  )
  await expect(desktopQuestionnaire).toBeVisible()
  await expect(desktopQuestionnaire).toContainText("告诉我们，你在等待什么")
  await expect(desktopQuestionnaire).toContainText("你最想先看到哪一部分？")
  await page.getByLabel("问卷标题").focus()
  await expect(
    desktopQuestionnaire.locator('[data-editor-target="questionnaire-title"]')
  ).toHaveAttribute("data-editor-active", "true")
  await expect(page.getByRole("button", { name: "编辑模式" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  await expect(page.getByRole("button", { name: "手机预览" })).toHaveCount(0)
  await page.locator('[data-preview-device="desktop"] [data-editor-target="title"]').first().click()
  await expect(page.locator('[data-preview-source="title"]')).toBeInViewport()
  await page.getByRole("button", { name: "预览模式" }).click()
  await expect(page.getByRole("button", { name: "手机预览" })).toBeVisible()
  await desktopQuestionnaire.getByRole("radio", { name: "协作流程" }).check()
  await desktopQuestionnaire
    .getByLabel("还有什么，会让这次更新对你更有价值？")
    .fill("预览中的回答不会提交")
  await desktopQuestionnaire.getByLabel(emailLabel).fill("preview@gmail.com")
  const editorUrl = page.url()
  await desktopQuestionnaire.getByRole("button", { name: "预约首发通知" }).click()
  await expect(page).toHaveURL(editorUrl)
  await expect(desktopQuestionnaire.getByLabel(emailLabel)).toHaveValue("preview@gmail.com")
  await expect(desktopQuestionnaire.getByLabel(emailLabel)).toHaveAttribute("required", "")

  await page.getByRole("button", { name: "编辑模式" }).click()
  await page.getByLabel("启用预约问卷").click()
  await expect(desktopSubscription.locator(".campaign-questionnaire")).toHaveCount(0)
  await expect(desktopSubscription.getByLabel(emailLabel)).toBeVisible()
  await page.getByLabel("启用预约问卷").click()
  await page.getByRole("button", { name: "预览模式" }).click()

  const editorColumns = await page
    .locator(".campaign-studio > main")
    .evaluate((editor) =>
      Array.from(editor.children).map((column) => column.getBoundingClientRect().width)
    )
  expect(editorColumns[0]).toBeLessThanOrEqual(70)
  expect(editorColumns[1]).toBeLessThanOrEqual(362)
  await expect(page.locator(".studio-grid .lucide-app-window-mac").first()).toBeVisible()
  expect(await page.locator(".studio-grid .lucide-app-window-mac").count()).toBeGreaterThanOrEqual(
    2
  )

  await page.getByLabel("主标题").fill("REPSSUPERCALIFRAGILISTICEXPIALIDOCIOUS下一代协作界面")
  const desktopPreviewMetrics = await page
    .locator('[data-preview-device="desktop"] .preview-device-scroll')
    .evaluate((viewport) => ({
      scrollHeight: viewport.scrollHeight,
      clientHeight: viewport.clientHeight,
      sectionCount: viewport.querySelectorAll(".campaign-page > section").length,
      hasClosing: Boolean(viewport.querySelector(".campaign-page-closing")),
      noHorizontalOverflow: viewport.scrollWidth <= viewport.clientWidth,
    }))
  expect(desktopPreviewMetrics.scrollHeight).toBeGreaterThan(desktopPreviewMetrics.clientHeight)
  expect(desktopPreviewMetrics.sectionCount).toBe(5)
  expect(desktopPreviewMetrics.hasClosing).toBe(true)
  expect(desktopPreviewMetrics.noHorizontalOverflow).toBe(true)

  await page.getByRole("button", { name: "手机预览" }).click()
  const mobileDevice = page.locator('[data-preview-device="mobile"]')
  await expect(mobileDevice).toBeVisible()
  await expect(mobileDevice.locator(".preview-device-dynamic-island")).toBeVisible()
  await expect(mobileDevice.locator(".preview-device-side-controls > i")).toHaveCount(4)
  await expect(mobileDevice.locator(".preview-device-home-area")).toBeVisible()
  await expect(mobileDevice.locator("[data-preview-questionnaire]")).toContainText(
    "告诉我们，你在等待什么"
  )
  const mobileMetrics = await mobileDevice.evaluate((device) => {
    const deviceRect = device.getBoundingClientRect()
    const viewport = device.querySelector(".preview-device-scroll")
    const videoSection = viewport?.querySelector(".campaign-page-video-section")
    const videoFrame = viewport?.querySelector(".campaign-page-video-frame")

    return {
      deviceWidth: deviceRect.width,
      scrollHeight: viewport?.scrollHeight ?? 0,
      clientHeight: viewport?.clientHeight ?? 0,
      hasTimeline: Boolean(viewport?.querySelector(".campaign-page-timeline")),
      hasClosing: Boolean(viewport?.querySelector(".campaign-page-closing")),
      hasVideoSection: Boolean(videoSection),
      videoFitsViewport:
        (videoFrame?.getBoundingClientRect().width ?? 0) <=
        (viewport?.getBoundingClientRect().width ?? 0),
      noHorizontalOverflow: (viewport?.scrollWidth ?? 1) <= (viewport?.clientWidth ?? 0),
      shellRadius: Number.parseFloat(getComputedStyle(device).borderRadius),
      screenRadius: Number.parseFloat(
        getComputedStyle(
          device.querySelector(".preview-device-mobile-screen") ?? document.documentElement
        ).borderRadius
      ),
    }
  })
  expect(mobileMetrics.deviceWidth).toBeLessThanOrEqual(340)
  expect(mobileMetrics.scrollHeight).toBeGreaterThan(mobileMetrics.clientHeight)
  expect(mobileMetrics.hasTimeline).toBe(true)
  expect(mobileMetrics.hasClosing).toBe(true)
  expect(mobileMetrics.hasVideoSection).toBe(true)
  expect(mobileMetrics.videoFitsViewport).toBe(true)
  expect(mobileMetrics.noHorizontalOverflow).toBe(true)
  expect(mobileMetrics.shellRadius).toBeGreaterThanOrEqual(48)
  expect(mobileMetrics.screenRadius).toBeGreaterThanOrEqual(42)

  await page.getByLabel("上传背景图片").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z2S8AAAAASUVORK5CYII=",
      "base64"
    ),
  })
  await expect(page.getByText("图片已加载到本地预览")).toBeVisible()
  await expect(page.getByAltText("当前背景图片预览")).toHaveAttribute("src", /^blob:/)

  await page.getByRole("button", { name: "打开全屏预览" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("heading", { name: "轨道首发全屏预览" })).toBeVisible()
  const fullscreenFrame = page.locator("[data-fullscreen-preview-frame]")
  await expect(fullscreenFrame).toHaveAttribute("data-viewport", "mobile")
  await expect(fullscreenFrame.locator("[data-preview-questionnaire]")).toContainText(
    "告诉我们，你在等待什么"
  )
  const fullscreenMobileMetrics = await fullscreenFrame.evaluate((frame) => {
    const rect = frame.getBoundingClientRect()
    return {
      bottom: rect.bottom,
      height: rect.height,
      viewportHeight: window.innerHeight,
      width: rect.width,
    }
  })
  expect(fullscreenMobileMetrics.width).toBeLessThanOrEqual(420)
  expect(fullscreenMobileMetrics.bottom).toBeLessThanOrEqual(fullscreenMobileMetrics.viewportHeight)

  await page.getByRole("button", { name: "全屏桌面预览" }).click()
  await expect(fullscreenFrame).toHaveAttribute("data-viewport", "desktop")
  const fullscreenDesktopMetrics = await fullscreenFrame.evaluate((frame) => {
    const rect = frame.getBoundingClientRect()
    return {
      bottom: rect.bottom,
      right: rect.right,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    }
  })
  expect(fullscreenDesktopMetrics.bottom).toBeLessThanOrEqual(
    fullscreenDesktopMetrics.viewportHeight
  )
  expect(fullscreenDesktopMetrics.right).toBeLessThanOrEqual(fullscreenDesktopMetrics.viewportWidth)
  await page.getByRole("button", { name: "关闭全屏预览" }).click()

  await page.getByRole("button", { name: "保存草稿" }).click()
  await expect(page.getByText("演示草稿已模拟保存，连接 Supabase 后可持久保存。")).toBeVisible()

  await page.getByRole("button", { name: "复制分享链接" }).click()
  await expect(page.getByText("分享链接已复制")).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(`${new URL(page.url()).origin}/p/reps-release-preview`)
})

test("summarizes subscribers and opens response intelligence in a drawer", async ({
  page,
  request,
}) => {
  await page.goto("/dashboard/campaigns/demo-launch/subscribers")

  await expect(page.getByRole("heading", { name: "REPS 2.0 功能预告" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "来源", exact: true })).toBeVisible()
  await expect(page.getByRole("cell", { name: "地区", exact: true })).toBeVisible()
  await expect(page.getByRole("cell", { name: "参与度", exact: true })).toBeVisible()
  await expect(page.locator("table")).not.toContainText("希望跨团队确认不再散落在聊天记录里。")

  await page.getByRole("row", { name: /lin@example.com/ }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("heading", { name: "lin@example.com" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "参与度" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "地域与环境" })).toBeVisible()
  await expect(page.getByText("希望跨团队确认不再散落在聊天记录里。")).toBeVisible()
  await page.getByRole("button", { name: "关闭" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)

  await page.getByRole("button", { name: "复制 lin@example.com" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)

  await page.getByLabel("搜索预约邮箱、来源或地区").fill("wechat")
  await expect(page.locator("table").getByText("lin@example.com")).toBeVisible()
  await expect(page.getByText("product@example.com")).toHaveCount(0)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.getByRole("button", { name: "查看详情" }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.waitForTimeout(250)
  const mobileDrawerMetrics = await page
    .locator('[data-slot="sheet-content"]')
    .evaluate((sheet) => ({
      noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      right: sheet.getBoundingClientRect().right,
      width: sheet.getBoundingClientRect().width,
    }))
  expect(mobileDrawerMetrics.noPageOverflow).toBe(true)
  expect(mobileDrawerMetrics.right).toBeLessThanOrEqual(390)
  expect(mobileDrawerMetrics.width).toBeLessThanOrEqual(390)
  await page.getByRole("button", { name: "关闭" }).click()

  const response = await request.get("/dashboard/campaigns/demo-launch/subscribers/export")
  expect(response.ok()).toBe(true)
  const csv = await response.text()
  expect(csv).toContain("question:你最想先看到哪一部分？")
  expect(csv).toContain("协作流程")

  const draftExport = await request.get("/dashboard/campaigns/demo-editorial/subscribers/export")
  expect(draftExport.status()).toBe(404)

  await page.goto("/dashboard/campaigns/demo-editorial/subscribers")
  await expect(page.getByText("页面不存在或已撤回", { exact: true })).toBeVisible()
})

test("switches templates, curated colors, and motion systems in the editor", async ({ page }) => {
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  await page.getByRole("button", { name: "未来档案：明亮留白与杂志秩序" }).click()
  await expect(page.getByText(/未来档案提供 4 种适配动效/)).toBeVisible()
  await expect(page.getByRole("button", { name: "动态切片：更有张力的错位与切入" })).toHaveCount(0)

  await page.getByRole("button", { name: "瑞士工坊：国际主义网格与印刷张力" }).click()
  await expect(page.locator('input[name="template"]')).toHaveValue("atelier")
  await expect(page.getByText("Live Canvas / ATL-07")).toBeVisible()

  await page.getByRole("button", { name: "月面白" }).click()
  await expect(page.locator('input[name="themeColor"]')).toHaveValue("#F2F4EE")

  await page.getByRole("button", { name: "动态切片：更有张力的错位与切入" }).click()
  await expect(page.locator('input[name="motion"]')).toHaveValue("kinetic")
  await expect(page.locator(".studio-grid .campaign-motion")).toHaveAttribute(
    "data-motion",
    "kinetic"
  )
  await page.getByRole("button", { name: "强烈：放大位移与空间层次" }).click()
  await page.getByRole("switch", { name: "环境动效" }).click()
  await page.getByRole("slider", { name: "播放速度" }).press("ArrowRight")
  await expect(page.locator('input[name="motionSettings"]')).toHaveValue(/"intensity":"bold"/)
  await expect(page.locator('input[name="motionSettings"]')).toHaveValue(/"ambient":false/)
  await expect(page.locator('input[name="motionSettings"]')).toHaveValue(/"speed":1\.1/)
  await expect(page.locator(".studio-grid .campaign-motion")).toHaveAttribute(
    "data-motion-ambient",
    "false"
  )
  await expect(page.locator(".studio-grid .campaign-motion")).toHaveAttribute(
    "data-motion-intensity",
    "bold"
  )
})

test("hides page modules and adapts repeatable content counts", async ({ page }) => {
  await page.goto("/dashboard/campaigns/demo-launch/edit")
  await page.locator("#campaign-content").scrollIntoViewIfNeeded()

  const preview = page.locator(".studio-grid .campaign-page")
  await expect(preview.locator(".campaign-page-timeline")).toHaveCount(1)
  await page.getByRole("switch", { name: "发布节奏", exact: true }).click()
  await expect(preview.locator(".campaign-page-timeline")).toHaveCount(0)
  await expect(page.locator('input[name="sectionVisibility"]')).toHaveValue(/"timeline":false/)

  await expect(preview.locator(".campaign-page-highlights article")).toHaveCount(3)
  await page.getByRole("button", { name: "新增亮点" }).click()
  await expect(preview.locator(".campaign-page-highlights article")).toHaveCount(4)
  await page.getByRole("button", { name: "删除第 4 个核心亮点" }).click()
  await expect(preview.locator(".campaign-page-highlights article")).toHaveCount(3)
})

test("keeps the dark dashboard compact and aligns the editor rails", async ({ page }, testInfo) => {
  const runtimeWarnings: string[] = []
  page.on("console", (message) => {
    if (/GSAP target|hydrated but some attributes/i.test(message.text())) {
      runtimeWarnings.push(message.text())
    }
  })

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard")

  const shellMetrics = await page.locator(".dashboard-shell").evaluate((shell) => {
    const sidebar = shell.querySelector('[data-slot="sidebar-inner"]')
    const header = shell.querySelector(".dashboard-header")
    const cards = Array.from(shell.querySelectorAll<HTMLElement>(".dashboard-project-card"))
    const cardRects = cards.map((card) => card.getBoundingClientRect())

    return {
      colorScheme: getComputedStyle(shell).colorScheme,
      separateSurfaces:
        Boolean(sidebar) &&
        Boolean(header) &&
        getComputedStyle(sidebar as Element).backgroundColor !==
          getComputedStyle(header as Element).backgroundColor,
      sidebarCreateLinks: shell.querySelectorAll(
        '[data-slot="sidebar-container"] a[href="/dashboard/new"]'
      ).length,
      cardCount: cards.length,
      maximumCardWidth: Math.max(...cardRects.map((rect) => rect.width)),
      maximumCardHeight: Math.max(...cardRects.map((rect) => rect.height)),
    }
  })
  expect(shellMetrics.colorScheme).toBe("dark")
  expect(shellMetrics.separateSurfaces).toBe(true)
  expect(shellMetrics.sidebarCreateLinks).toBe(0)
  expect(shellMetrics.cardCount).toBeGreaterThan(0)
  expect(shellMetrics.maximumCardWidth).toBeLessThan(320)
  expect(shellMetrics.maximumCardHeight).toBeLessThan(430)

  await page.getByRole("button", { name: "展开全部 16 套" }).scrollIntoViewIfNeeded()
  await page.getByRole("button", { name: "展开全部 16 套" }).click()
  await expect(page.getByRole("button", { name: "收起模板" })).toHaveAttribute(
    "aria-expanded",
    "true"
  )

  const templateMetrics = await page
    .locator(".dashboard-template-showcase")
    .evaluate((showcase) => ({
      cardCount: showcase.querySelectorAll(":scope > article").length,
      overflowY: getComputedStyle(showcase).overflowY,
      clientHeight: showcase.clientHeight,
      scrollHeight: showcase.scrollHeight,
    }))
  expect(templateMetrics.cardCount).toBe(16)
  expect(templateMetrics.overflowY).toBe("auto")
  expect(templateMetrics.clientHeight).toBeLessThanOrEqual(672)
  expect(templateMetrics.scrollHeight).toBeGreaterThan(templateMetrics.clientHeight)
  await page
    .locator(".dashboard-template-panel")
    .screenshot({ path: testInfo.outputPath("dashboard-template-panel.png") })

  await page.goto("/dashboard/campaigns/demo-launch/edit")
  const railMetrics = await page.locator(".campaign-studio").evaluate((studio) => {
    const backSlot = studio.querySelector(".campaign-studio-back-slot")?.getBoundingClientRect()
    const editorNavigation = studio
      .querySelector('nav[aria-label="编辑器区块"]')
      ?.getBoundingClientRect()

    return {
      backSlotRight: backSlot?.right ?? 0,
      navigationRight: editorNavigation?.right ?? 0,
    }
  })
  expect(Math.abs(railMetrics.backSlotRight - railMetrics.navigationRight)).toBeLessThan(1)
  expect(runtimeWarnings).toEqual([])
})

test("keeps primary pages usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll")
  await expect(page.getByRole("link", { name: "浏览预告样式" })).toBeVisible()

  await page.goto("/dashboard")

  await expect(
    page.getByRole("heading", { name: "每一次发布，都从这里进入稳定轨道。" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "打开导航" })).toBeVisible()
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll")

  await page.goto("/p/reps-release-preview")
  await page.locator(".campaign-questionnaire-title").scrollIntoViewIfNeeded()
  await expect(page.getByRole("heading", { name: "在抵达之前，留下你的坐标" })).toBeVisible()
  const publicFormMetrics = await page.locator("form.campaign-subscribe").evaluate((form) => {
    const questionnaire = form.querySelector(".campaign-questionnaire")
    const emailRow = form.querySelector(".campaign-subscribe-email-row")
    const emailField = form.querySelector(".campaign-subscribe-field")
    const submitButton = form.querySelector(".campaign-subscribe-button")
    const questionnaireRect = questionnaire?.getBoundingClientRect()
    const emailRowRect = emailRow?.getBoundingClientRect()
    const emailFieldRect = emailField?.getBoundingClientRect()
    const submitButtonRect = submitButton?.getBoundingClientRect()

    return {
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      noFormOverlap:
        Boolean(questionnaireRect) &&
        Boolean(emailRowRect) &&
        (questionnaireRect?.bottom ?? 0) <= (emailRowRect?.top ?? 0),
      equalControlHeight:
        Math.abs((emailFieldRect?.height ?? 0) - (submitButtonRect?.height ?? 0)) < 1,
    }
  })
  expect(publicFormMetrics).toEqual({
    noHorizontalOverflow: true,
    noFormOverlap: true,
    equalControlHeight: true,
  })
})

test("exposes the migrated account recovery and legal pages", async ({ page }) => {
  await page.goto("/login")

  const passwordLabel = page.locator('label[for="login-password"]')
  const forgotPasswordLink = page.getByRole("link", { name: "忘记密码" })
  await expect(forgotPasswordLink).toBeVisible()

  const [passwordLabelBox, forgotPasswordBox] = await Promise.all([
    passwordLabel.boundingBox(),
    forgotPasswordLink.boundingBox(),
  ])
  expect(Math.abs((passwordLabelBox?.y ?? 0) - (forgotPasswordBox?.y ?? 0))).toBeLessThan(8)
  expect(forgotPasswordBox?.x ?? 0).toBeGreaterThan(passwordLabelBox?.x ?? 0)
  await expect(page.locator('[data-slot="card-header"] > div').first()).toHaveCSS("display", "flex")
  await expect(page.getByRole("textbox", { name: "邮箱", exact: true })).toBeVisible()
  await expect(page.getByRole("textbox", { name: "密码", exact: true })).toBeVisible()
  await expect(page.getByRole("textbox", { name: "邮箱", exact: true })).toHaveAttribute(
    "placeholder",
    "请输入登录邮箱"
  )
  await expect(page.getByRole("textbox", { name: "密码", exact: true })).toHaveAttribute(
    "placeholder",
    "请输入密码"
  )
  const loginControlHeights = await page
    .getByRole("textbox", { name: "邮箱", exact: true })
    .evaluate((emailInput) => {
      const emailGroup = emailInput.closest('[data-slot="input-group"]')
      const submitButton = document.querySelector<HTMLButtonElement>('button[type="submit"]')
      return {
        email: emailGroup?.getBoundingClientRect().height ?? 0,
        submit: submitButton?.getBoundingClientRect().height ?? 0,
      }
    })
  expect(loginControlHeights.email).toBeGreaterThan(40)
  expect(Math.abs(loginControlHeights.email - loginControlHeights.submit)).toBeLessThan(1)
  await expect(page.getByText("账号密码", { exact: true })).toBeHidden()
  await expect(page.getByText("邮箱验证码", { exact: true })).toBeHidden()

  await page.goto("/login?method=otp")
  const otpInput = page.getByRole("textbox", { name: "验证码", exact: true })
  await expect(otpInput).toHaveAttribute("placeholder", "请输入邮件中的数字验证码")
  await otpInput.fill("123456789012")
  await expect(otpInput).toHaveValue("123456789012")
  await expect(otpInput).toHaveAttribute("pattern", "[0-9]+")
  await expect(otpInput).not.toHaveAttribute("maxlength")

  await page.goto("/login")
  await page.getByRole("tab", { name: "注册" }).click()
  await expect(page.getByText(/至少 8 个字符，并包含/)).toHaveCount(0)
  await page.getByLabel("设置密码").fill("REPS@2026")
  await expect(page.getByText("已满足安全要求，请勿与其他网站共用。")).toBeVisible()
  await expect(page.getByLabel("确认密码")).toHaveAttribute("placeholder", "请再次输入密码")
  await page.getByLabel("确认密码").fill("Mismatch@2026")
  const confirmPasswordError = page.locator('[data-error-for="confirm-password"]')
  await expect(confirmPasswordError).toHaveText("两次输入不一致")
  const [confirmLabelBox, confirmErrorBox] = await Promise.all([
    page.locator('label[for="confirm-password"]').boundingBox(),
    confirmPasswordError.boundingBox(),
  ])
  expect(Math.abs((confirmLabelBox?.y ?? 0) - (confirmErrorBox?.y ?? 0))).toBeLessThan(8)
  const confirmFieldStyles = await page
    .locator('[data-error-for="confirm-password"]')
    .evaluate((errorElement) => {
      const label = errorElement.parentElement?.querySelector('label[for="confirm-password"]')
      const input = document.querySelector<HTMLInputElement>("#confirm-password")
      const labelStyle = label ? getComputedStyle(label) : null
      const errorStyle = getComputedStyle(errorElement)
      const placeholderStyle = input ? getComputedStyle(input, "::placeholder") : null

      return {
        errorFollowsLabel: label
          ? Boolean(label.compareDocumentPosition(errorElement) & Node.DOCUMENT_POSITION_FOLLOWING)
          : false,
        errorColor: errorStyle.color,
        labelColor: labelStyle?.color ?? "",
        labelFontSize: Number.parseFloat(labelStyle?.fontSize ?? "0"),
        placeholderFontSize: Number.parseFloat(placeholderStyle?.fontSize ?? "0"),
      }
    })
  expect(confirmFieldStyles.errorFollowsLabel).toBe(true)
  expect(confirmFieldStyles.labelColor).not.toBe(confirmFieldStyles.errorColor)
  expect(confirmFieldStyles.labelFontSize).toBeGreaterThanOrEqual(15)
  expect(confirmFieldStyles.placeholderFontSize).toBeLessThan(confirmFieldStyles.labelFontSize)
  await page.getByLabel("确认密码").fill("REPS@2026")
  await expect(confirmPasswordError).toHaveCount(0)

  await expect(page.getByRole("link", { name: "《服务条款》" })).toBeVisible()
  const [legalBox, createAccountBox] = await Promise.all([
    page.getByRole("checkbox").boundingBox(),
    page.getByRole("button", { name: "创建账号" }).boundingBox(),
  ])
  expect(legalBox?.y ?? 0).toBeLessThan(createAccountBox?.y ?? 0)
  await page.getByRole("link", { name: "《隐私政策》" }).click()

  await expect(page).toHaveURL(/privacy$/)
  await expect(page.getByRole("heading", { name: "隐私政策", level: 1 })).toBeVisible()

  await page.goto("/reset-password")
  await page.getByLabel("新密码", { exact: true }).fill("Reset@2026")
  await expect(page.getByText("已满足安全要求，请勿与其他网站共用。")).toBeVisible()
})

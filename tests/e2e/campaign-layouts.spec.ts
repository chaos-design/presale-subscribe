import { expect, test } from "@playwright/test"

import { productConfig } from "@/lib/product-config"

test("keeps campaign controls local to their modules", async ({ page }, testInfo) => {
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  await expect(page.getByText("模块显示", { exact: true })).toHaveCount(0)
  await expect(
    page.locator("#section-visibility-hero").locator("xpath=ancestor::header")
  ).toContainText("首屏内容")
  await expect(
    page.locator("#section-visibility-highlights").locator("xpath=ancestor::header")
  ).toContainText("核心亮点")
  await expect(
    page.locator("#section-visibility-timeline").locator("xpath=ancestor::header")
  ).toContainText("发布节奏")
  await expect(page.locator("#section-visibility-signup")).toBeVisible()
  await expect(page.locator("#section-visibility-signup")).toBeChecked()
  await expect(page.locator("#campaign-signup .campaign-editor-section-header")).toContainText(
    "预约"
  )
  await expect(page.locator("#countdown-enabled")).toBeVisible()
  await expect(
    page.locator('[data-preview-device="desktop"] .campaign-page-countdown')
  ).toHaveCount(0)
  await page.getByRole("switch", { name: "显示倒计时" }).click()
  await expect(
    page.locator('[data-preview-device="desktop"] .campaign-page-countdown')
  ).toBeVisible()
  await expect(
    page.locator('[data-preview-device="desktop"] .campaign-page-countdown-grid dd')
  ).toHaveCount(4)
  const countdownTarget = page.locator("#countdown-target")
  const countdownTime = page.locator("#countdown-target-time")
  const countdownValue = page.locator('input[name="countdown"]')
  await expect(countdownTarget).toHaveAttribute("aria-haspopup", "dialog")
  await expect(countdownTarget).toContainText(/\d{4}年\d{1,2}月\d{1,2}日/)
  await expect(countdownTime).toHaveAttribute("type", "time")
  await expect(countdownTime).toHaveAttribute("step", "1")
  await expect(countdownTime).toHaveValue(/\d{2}:\d{2}:\d{2}/)
  const initialCountdownTarget = JSON.parse(await countdownValue.inputValue()) as {
    targetAt: string
  }
  await countdownTarget.click()
  const calendar = page.locator('[data-slot="calendar"]')
  await expect(calendar).toBeVisible()
  await calendar.locator('button[data-day]:not([data-selected-single="true"])').first().click()
  await expect
    .poll(async () => {
      const countdown = JSON.parse(await countdownValue.inputValue()) as {
        targetAt: string
      }
      return countdown.targetAt
    })
    .not.toBe(initialCountdownTarget.targetAt)
  const dateAdjustedCountdown = JSON.parse(await countdownValue.inputValue()) as {
    targetAt: string
  }
  await countdownTime.fill("17:54:09")
  const expectedCountdownTarget = new Date(dateAdjustedCountdown.targetAt)
  expectedCountdownTarget.setHours(17, 54, 9, 0)
  await expect
    .poll(async () => {
      const countdown = JSON.parse(await countdownValue.inputValue()) as {
        targetAt: string
      }
      return countdown.targetAt
    })
    .toBe(expectedCountdownTarget.toISOString())
  await page.getByRole("switch", { name: "显示预约" }).click()
  await expect(page.locator('[data-preview-device="desktop"] .campaign-page-closing')).toHaveCount(
    0
  )
  await page.getByRole("switch", { name: "显示预约" }).click()
  await expect(page.locator('[data-preview-device="desktop"] .campaign-page-closing')).toBeVisible()
  await expect(page.getByAltText("当前背景图片预览")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "移除图片" })).toHaveCount(0)
  await expect(page.getByText(/建议尺寸 1600 × 2000 px/)).toBeVisible()
  await page.locator("#cover-image").fill("https://avatars.githubusercontent.com/u/20939839?v=4")
  await expect(page.getByAltText("当前背景图片预览")).toHaveAttribute(
    "src",
    "https://avatars.githubusercontent.com/u/20939839?v=4"
  )
  await expect(page.getByRole("button", { name: "移除图片" })).toBeVisible()

  const positionEditor = page.locator(".campaign-cover-position-editor")
  await positionEditor.scrollIntoViewIfNeeded()
  const positionEditorBounds = await positionEditor.boundingBox()
  if (!positionEditorBounds) {
    throw new Error("封面位置编辑器不可见")
  }
  await page.mouse.move(
    positionEditorBounds.x + positionEditorBounds.width / 2,
    positionEditorBounds.y + positionEditorBounds.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(
    positionEditorBounds.x + positionEditorBounds.width / 2 - 48,
    positionEditorBounds.y + positionEditorBounds.height / 2 - 36,
    { steps: 6 }
  )
  await page.mouse.up()
  await expect(page.locator('input[name="coverImagePosition"]')).not.toHaveValue('{"x":50,"y":50}')
  const editedPosition = JSON.parse(
    await page.locator('input[name="coverImagePosition"]').inputValue()
  ) as { x: number; y: number }
  const previewObjectPosition = await page
    .locator('[data-preview-device="desktop"] .campaign-page-image img')
    .first()
    .evaluate((image) =>
      getComputedStyle(image)
        .objectPosition.split(" ")
        .map((position) => Number.parseFloat(position))
    )
  expect(previewObjectPosition[0]).toBeCloseTo(editedPosition.x, 3)
  expect(previewObjectPosition[1]).toBeCloseTo(editedPosition.y, 3)

  for (const sectionId of [
    "campaign-video",
    "campaign-highlights",
    "campaign-timeline",
    "campaign-signup",
  ]) {
    await expect(
      page.locator(`#${sectionId} .campaign-editor-section-title-row > span`)
    ).toBeVisible()
  }

  const editorMetrics = await page.locator(".campaign-studio").evaluate((studio) => {
    const configContent = studio.querySelector("main > aside > div")
    const chevrons = Array.from(
      studio.querySelectorAll<SVGElement>(".campaign-editor-section-trigger > svg")
    )

    return {
      horizontalPadding: configContent
        ? [
            Number.parseFloat(getComputedStyle(configContent).paddingLeft),
            Number.parseFloat(getComputedStyle(configContent).paddingRight),
          ]
        : [],
      chevronLefts: chevrons.map((chevron) => chevron.getBoundingClientRect().left),
    }
  })
  expect(editorMetrics.horizontalPadding).toEqual([16, 16])
  expect(
    Math.max(...editorMetrics.chevronLefts) - Math.min(...editorMetrics.chevronLefts)
  ).toBeLessThan(1)

  const addHighlight = page.getByRole("button", { name: "新增亮点" })
  await expect(addHighlight).toBeVisible()
  await expect(page.getByText("新增亮点", { exact: true })).toHaveCount(0)

  const preview = page.locator(".preview-device-scroll .campaign-page").first()
  await page.getByRole("button", { name: "未来档案：明亮留白与杂志秩序" }).click()
  await expect(preview).toHaveAttribute("data-hero-media", "before-copy")
  await expect(preview).toHaveAttribute("data-highlights-layout", "index")
  await expect(preview).toHaveAttribute("data-timeline-layout", "vertical")
  await expect(preview).toHaveAttribute("data-closing-layout", "stacked")
  await expect(preview).toHaveAttribute("data-subscription-layout", "matrix")

  const editorialSectionOrder = await preview.evaluate((campaignPage) =>
    Array.from(campaignPage.children)
      .map((element) => {
        if (element.classList.contains("campaign-page-intro")) return "highlights"
        if (element.classList.contains("campaign-page-timeline")) return "timeline"
        if (element.classList.contains("campaign-page-marquee")) return "slogan"
        if (element.classList.contains("campaign-page-closing")) return "signup"
        return null
      })
      .filter(Boolean)
  )
  expect(editorialSectionOrder).toEqual(["highlights", "timeline", "slogan", "signup"])

  await page.getByRole("button", { name: "信号终端：高密度数据与终端语言" }).click()
  await expect(preview).toHaveAttribute("data-highlights-layout", "cards")
  await expect(preview).toHaveAttribute("data-timeline-layout", "compact")
  await expect(preview).toHaveAttribute("data-closing-layout", "reverse")
  await expect(preview).toHaveAttribute("data-subscription-layout", "matrix")

  const atelierTemplate = page.getByRole("button", {
    name: "瑞士工坊：国际主义网格与印刷张力",
  })
  await atelierTemplate.scrollIntoViewIfNeeded()
  await expect(async () => {
    await atelierTemplate.click()
    await expect(preview).toHaveAttribute("data-subscription-layout", "sidebar", {
      timeout: 1_500,
    })
  }).toPass({ timeout: 10_000 })

  await page.screenshot({
    path: testInfo.outputPath("campaign-editor-layouts.png"),
    fullPage: false,
  })
})

test("centers copy inside circular hero templates", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  const preview = page.locator('[data-preview-device="desktop"] .campaign-page').first()
  const circularTemplates = [
    {
      buttonName: "深空轨道：环形坐标与影院构图",
      template: "orbit",
      screenshot: "orbit-circular-hero.png",
    },
    {
      buttonName: "午夜首映：电影片头与夜色奢华",
      template: "nocturne",
      screenshot: "midnight-premiere-hero.png",
    },
  ] as const

  for (const item of circularTemplates) {
    await page.getByRole("button", { name: item.buttonName }).click()
    await expect(preview).toHaveAttribute("data-template", item.template)
    await expect(preview.locator(".campaign-page-hero-copy")).toBeVisible()
    await expect(preview.locator(".campaign-page-hero-visual")).toBeVisible()
    const heroMetrics = await preview.evaluate((campaignPage) => {
      const copy = campaignPage.querySelector(".campaign-page-hero-copy")
      const visual = campaignPage.querySelector(".campaign-page-hero-visual")
      const image = campaignPage.querySelector(".campaign-page-image")
      const title = campaignPage.querySelector(".campaign-public-title")
      const kicker = campaignPage.querySelector(".campaign-page-kicker")
      const description = campaignPage.querySelector(".campaign-page-hero-copy > p")
      const status = campaignPage.querySelector(".campaign-page-hero-status")
      const copyRect = copy?.getBoundingClientRect()
      const visualRect = visual?.getBoundingClientRect()
      const imageRect = image?.getBoundingClientRect()
      const contentRects = [kicker, title, description, status]
        .map((element) => element?.getBoundingClientRect())
        .filter((rect): rect is DOMRect => Boolean(rect))
      const descriptionRect = description?.getBoundingClientRect()
      const statusRect = status?.getBoundingClientRect()
      const titleStyle = title ? getComputedStyle(title) : null
      const imageStyle = image ? getComputedStyle(image) : null
      const contentBounds =
        contentRects.length > 0
          ? {
              top: Math.min(...contentRects.map((rect) => rect.top)),
              right: Math.max(...contentRects.map((rect) => rect.right)),
              bottom: Math.max(...contentRects.map((rect) => rect.bottom)),
              left: Math.min(...contentRects.map((rect) => rect.left)),
            }
          : null

      return {
        copyWidth: copyRect?.width ?? 0,
        visualWidth: visualRect?.width ?? 0,
        copyInnerCircleCenterXDifference: Math.abs(
          (copyRect?.left ?? 0) +
            (copyRect?.width ?? 0) / 2 -
            ((imageRect?.left ?? 0) + (imageRect?.width ?? 0) / 2)
        ),
        copyInnerCircleCenterYDifference: Math.abs(
          (copyRect?.top ?? 0) +
            (copyRect?.height ?? 0) / 2 -
            ((imageRect?.top ?? 0) + (imageRect?.height ?? 0) / 2)
        ),
        centerXDifference: Math.abs(
          (copyRect?.left ?? 0) +
            (copyRect?.width ?? 0) / 2 -
            ((visualRect?.left ?? 0) + (visualRect?.width ?? 0) / 2)
        ),
        centerYDifference: Math.abs(
          (copyRect?.top ?? 0) +
            (copyRect?.height ?? 0) / 2 -
            ((visualRect?.top ?? 0) + (visualRect?.height ?? 0) / 2)
        ),
        imageBorderRadius: imageStyle?.borderRadius ?? "",
        contentCenterXDifference: Math.abs(
          (contentBounds?.left ?? 0) +
            ((contentBounds?.right ?? 0) - (contentBounds?.left ?? 0)) / 2 -
            ((imageRect?.left ?? 0) + (imageRect?.width ?? 0) / 2)
        ),
        contentCenterYDifference: Math.abs(
          (contentBounds?.top ?? 0) +
            ((contentBounds?.bottom ?? 0) - (contentBounds?.top ?? 0)) / 2 -
            ((imageRect?.top ?? 0) + (imageRect?.height ?? 0) / 2)
        ),
        contentWithinInnerCircle:
          (contentBounds?.left ?? Number.NEGATIVE_INFINITY) >= (imageRect?.left ?? 0) - 1 &&
          (contentBounds?.right ?? Number.POSITIVE_INFINITY) <= (imageRect?.right ?? 0) + 1 &&
          (contentBounds?.top ?? Number.NEGATIVE_INFINITY) >= (imageRect?.top ?? 0) - 1 &&
          (contentBounds?.bottom ?? Number.POSITIVE_INFINITY) <= (imageRect?.bottom ?? 0) + 1,
        statusIsBelowDescription:
          (statusRect?.top ?? 0) >= (descriptionRect?.bottom ?? Number.POSITIVE_INFINITY) - 1,
        statusText: status?.textContent ?? "",
        titleFontStyle: titleStyle?.fontStyle ?? "",
        titleTextAlign: titleStyle?.textAlign ?? "",
        overflow: campaignPage.scrollWidth - campaignPage.clientWidth,
      }
    })

    expect(heroMetrics.copyWidth).toBeGreaterThan(200)
    expect(heroMetrics.visualWidth).toBeGreaterThan(300)
    expect(heroMetrics.centerXDifference).toBeLessThan(heroMetrics.visualWidth * 0.05)
    expect(heroMetrics.centerYDifference).toBeLessThan(heroMetrics.visualWidth * 0.1)
    expect(heroMetrics.imageBorderRadius).toBe("50%")
    expect(heroMetrics.titleFontStyle).toBe("normal")
    expect(heroMetrics.titleTextAlign).toBe("center")
    expect(heroMetrics.overflow).toBeLessThanOrEqual(1)

    if (item.template === "nocturne") {
      expect(heroMetrics.statusText).toContain("PREMIERE / INVITATION OPEN")
      expect(heroMetrics.statusText).toContain("SEAT LIST / NOW RESERVING")
      expect(heroMetrics.statusText).not.toContain("PUBLIC LINK / preview")
      expect(heroMetrics.copyInnerCircleCenterXDifference).toBeLessThan(1)
      expect(heroMetrics.copyInnerCircleCenterYDifference).toBeLessThan(1)
      expect(heroMetrics.contentCenterYDifference).toBeLessThan(heroMetrics.visualWidth * 0.025)
      expect(heroMetrics.contentWithinInnerCircle).toBe(true)
      expect(heroMetrics.statusIsBelowDescription).toBe(true)
    }

    await preview.locator(".campaign-page-hero").screenshot({
      path: testInfo.outputPath(item.screenshot),
    })
  }
})

test("runs the public hero atmosphere with GSAP", async ({ page }) => {
  await page.goto("/p/ahead-2-preview")

  const atmosphereSignal = page.locator(".campaign-page-hero-atmosphere > span").first()
  await expect(atmosphereSignal).toBeAttached()
  await page.waitForTimeout(900)
  const firstTransform = await atmosphereSignal.evaluate(
    (element) => getComputedStyle(element).transform
  )
  await page.waitForTimeout(700)
  const secondTransform = await atmosphereSignal.evaluate(
    (element) => getComputedStyle(element).transform
  )

  expect(firstTransform).not.toBe("none")
  expect(secondTransform).not.toBe(firstTransform)

  const closingArtwork = page.locator("[data-campaign-closing-art]")
  await closingArtwork.scrollIntoViewIfNeeded()
  await expect(closingArtwork).toBeVisible()
  const animatedMotif = closingArtwork
    .locator("[data-closing-art-layer], [data-closing-art-spin], [data-closing-art-pulse]")
    .first()
  await page.waitForTimeout(500)
  const firstMotifTransform = await animatedMotif.evaluate(
    (element) => getComputedStyle(element).transform
  )
  await page.waitForTimeout(700)
  const secondMotifTransform = await animatedMotif.evaluate(
    (element) => getComputedStyle(element).transform
  )

  expect(firstMotifTransform).not.toBe("none")
  expect(secondMotifTransform).not.toBe(firstMotifTransform)

  const movingTracer = closingArtwork.locator("[data-closing-art-tracer]").first()
  await expect(movingTracer).toBeAttached()
  const firstTraceOffset = await movingTracer.getAttribute("stroke-dashoffset")
  await page.waitForTimeout(600)
  const secondTraceOffset = await movingTracer.getAttribute("stroke-dashoffset")

  expect(secondTraceOffset).not.toBe(firstTraceOffset)
})

test("composes questionnaire and email fields by template and viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  await page.getByRole("button", { name: "信号终端：高密度数据与终端语言" }).click()
  await page.getByRole("button", { name: "预览模式" }).click()
  await page.getByRole("button", { name: "打开全屏预览" }).click()

  const fullscreenPreview = page.locator("[data-fullscreen-preview-frame] .campaign-page").first()
  await expect(fullscreenPreview).toHaveAttribute("data-subscription-layout", "matrix")
  await expect
    .poll(() =>
      fullscreenPreview.locator(".campaign-subscribe-fields").evaluate((fields) => {
        return getComputedStyle(fields).gridTemplateColumns.split(" ").length
      })
    )
    .toBe(2)

  const matrixMetrics = await fullscreenPreview.evaluate((campaignPage) => {
    const questionElements = Array.from(campaignPage.querySelectorAll(".campaign-question"))
    const questions = questionElements.map((question) => question.getBoundingClientRect())
    const firstQuestion = questionElements[0]
    const firstHeading = firstQuestion?.querySelector(".campaign-question-heading")
    const firstIndex = firstQuestion?.querySelector(".campaign-question-index")
    const firstLabel = firstQuestion?.querySelector(".campaign-question-label")
    const firstOption = firstQuestion?.querySelector(".campaign-question-option")
    const firstOptionText = firstOption?.querySelector("span")
    const email = campaignPage
      .querySelector(".campaign-subscribe-email-panel")
      ?.getBoundingClientRect()
    const emailInput = campaignPage.querySelector<HTMLInputElement>(".campaign-subscribe-input")
    const emailInputStyle = emailInput ? getComputedStyle(emailInput) : null
    let optionExpandsForLongText = false

    if (firstOption && firstOptionText) {
      const initialHeight = firstOption.getBoundingClientRect().height
      const originalText = firstOptionText.textContent
      firstOptionText.textContent =
        "这是一个用于验证长选项会在当前宽度内自动换行并向下撑开容器的完整选项说明。".repeat(3)
      optionExpandsForLongText = firstOption.getBoundingClientRect().height > initialHeight
      firstOptionText.textContent = originalText
    }

    return {
      firstPairTopDifference: Math.abs((questions[0]?.top ?? 0) - (questions[1]?.top ?? 0)),
      secondPairTopDifference: Math.abs((questions[2]?.top ?? 0) - (email?.top ?? 0)),
      emailIsRightOfThird: (email?.left ?? 0) > (questions[2]?.left ?? 0),
      emailLabel: campaignPage.querySelector(".campaign-subscribe-email-label")?.textContent,
      emailIndexCount: campaignPage.querySelectorAll(
        ".campaign-subscribe-email-panel .campaign-question-index"
      ).length,
      emailTextAlign: campaignPage.querySelector(".campaign-subscribe-email-label")
        ? getComputedStyle(campaignPage.querySelector(".campaign-subscribe-email-label") as Element)
            .textAlign
        : "",
      headingDisplay: firstHeading ? getComputedStyle(firstHeading).display : "",
      headingCenterDifference: Math.abs(
        (firstIndex?.getBoundingClientRect().top ?? 0) +
          (firstIndex?.getBoundingClientRect().height ?? 0) / 2 -
          ((firstLabel?.getBoundingClientRect().top ?? 0) +
            (firstLabel?.getBoundingClientRect().height ?? 0) / 2)
      ),
      optionLeftDifference: Math.abs(
        (firstOption?.getBoundingClientRect().left ?? 0) -
          (firstQuestion?.getBoundingClientRect().left ?? 0)
      ),
      optionWhiteSpace: firstOption ? getComputedStyle(firstOption).whiteSpace : "",
      optionExpandsForLongText,
      emailInputSize: emailInput?.getAttribute("size"),
      emailInputWidth: emailInput?.getBoundingClientRect().width ?? 0,
      emailInputMinWidth: emailInputStyle ? Number.parseFloat(emailInputStyle.minInlineSize) : 0,
    }
  })

  expect(matrixMetrics.firstPairTopDifference).toBeLessThan(1)
  expect(matrixMetrics.secondPairTopDifference).toBeLessThan(1)
  expect(matrixMetrics.emailIsRightOfThird).toBe(true)
  expect(matrixMetrics.emailLabel).toContain("留下你的邮箱")
  expect(matrixMetrics.emailIndexCount).toBe(0)
  expect(matrixMetrics.emailTextAlign).toBe("left")
  expect(matrixMetrics.headingDisplay).toBe("flex")
  expect(matrixMetrics.headingCenterDifference).toBeLessThan(2)
  expect(matrixMetrics.optionLeftDifference).toBeLessThan(1)
  expect(matrixMetrics.optionWhiteSpace).toBe("normal")
  expect(matrixMetrics.optionExpandsForLongText).toBe(true)
  expect(matrixMetrics.emailInputSize).toBe("30")
  expect(matrixMetrics.emailInputWidth).toBeGreaterThanOrEqual(matrixMetrics.emailInputMinWidth)
  await fullscreenPreview.locator(".campaign-page-closing").screenshot({
    path: testInfo.outputPath("subscription-matrix.png"),
  })

  await page.getByRole("button", { name: "关闭全屏预览" }).click()
  await page.getByRole("button", { name: "瑞士工坊：国际主义网格与印刷张力" }).click()
  await page.getByRole("button", { name: "打开全屏预览" }).click()
  await expect(fullscreenPreview).toHaveAttribute("data-subscription-layout", "sidebar")
  await expect
    .poll(() =>
      fullscreenPreview.evaluate((campaignPage) => {
        const copy = campaignPage
          .querySelector(".campaign-page-closing-grid > header")
          ?.getBoundingClientRect()
        const email = campaignPage
          .querySelector(".campaign-subscribe-email-panel")
          ?.getBoundingClientRect()

        return (
          Math.abs((email?.left ?? 0) - (copy?.left ?? 0)) < 8 &&
          (email?.top ?? 0) > (copy?.bottom ?? 0)
        )
      })
    )
    .toBe(true)

  const sidebarMetrics = await fullscreenPreview.evaluate((campaignPage) => {
    const question = campaignPage.querySelector(".campaign-question")?.getBoundingClientRect()
    const copy = campaignPage
      .querySelector(".campaign-page-closing-grid > header")
      ?.getBoundingClientRect()
    const email = campaignPage
      .querySelector(".campaign-subscribe-email-panel")
      ?.getBoundingClientRect()
    const emailField = campaignPage
      .querySelector(".campaign-subscribe-field")
      ?.getBoundingClientRect()

    return {
      questionLeft: question?.left ?? 0,
      questionRight: question?.right ?? 0,
      copyLeft: copy?.left ?? 0,
      emailLeft: email?.left ?? 0,
      emailWidth: email?.width ?? 0,
      emailFieldWidth: emailField?.width ?? 0,
      emailTop: email?.top ?? 0,
      copyBottom: copy?.bottom ?? 0,
    }
  })

  expect(sidebarMetrics.questionRight).toBeLessThanOrEqual(sidebarMetrics.copyLeft + 1)
  expect(Math.abs(sidebarMetrics.emailLeft - sidebarMetrics.copyLeft)).toBeLessThan(8)
  expect(sidebarMetrics.emailWidth).toBeGreaterThanOrEqual(416)
  expect(sidebarMetrics.emailFieldWidth).toBeGreaterThanOrEqual(240)
  expect(sidebarMetrics.emailTop).toBeGreaterThan(sidebarMetrics.copyBottom)
  await fullscreenPreview.locator(".campaign-page-closing").screenshot({
    path: testInfo.outputPath("subscription-sidebar.png"),
  })

  await page.getByRole("button", { name: "全屏手机预览" }).click()
  const mobilePreview = page
    .locator('[data-fullscreen-preview-frame][data-viewport="mobile"] .campaign-page')
    .first()
  const mobileMetrics = await mobilePreview.evaluate((campaignPage) => {
    const question = campaignPage.querySelector(".campaign-question")?.getBoundingClientRect()
    const email = campaignPage
      .querySelector(".campaign-subscribe-email-panel")
      ?.getBoundingClientRect()
    const emailField = campaignPage
      .querySelector(".campaign-subscribe-field")
      ?.getBoundingClientRect()
    const emailButton = campaignPage
      .querySelector(".campaign-subscribe-button")
      ?.getBoundingClientRect()

    return {
      leftDifference: Math.abs((question?.left ?? 0) - (email?.left ?? 0)),
      emailBelowQuestion: (email?.top ?? 0) > (question?.bottom ?? 0),
      emailControlsStacked: (emailButton?.top ?? 0) > (emailField?.bottom ?? 0),
      overflow: campaignPage.scrollWidth - campaignPage.clientWidth,
    }
  })

  expect(mobileMetrics.leftDifference).toBeLessThan(1)
  expect(mobileMetrics.emailBelowQuestion).toBe(true)
  expect(mobileMetrics.emailControlsStacked).toBe(true)
  expect(mobileMetrics.overflow).toBeLessThanOrEqual(1)
  await mobilePreview.locator(".campaign-page-closing").screenshot({
    path: testInfo.outputPath("subscription-mobile.png"),
  })
})

test("orders, hides, and collapses page regions with local persistence", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  const organizer = page.getByLabel("页面区域排序")
  await expect(organizer).toBeVisible()
  await expect(organizer.locator('[data-section="video"]')).toHaveAttribute("draggable", "true")
  await expect(organizer.locator('[data-section="signup"]')).toHaveAttribute("draggable", "true")
  await page.getByRole("button", { name: "下移演示视频" }).click()
  await expect(page.locator('input[name="sectionOrder"]')).toHaveValue(
    '["highlights","video","slogan","timeline","signup"]'
  )
  await page.getByRole("button", { name: "上移演示视频" }).click()
  await expect(page.locator('input[name="sectionOrder"]')).toHaveValue(
    '["video","highlights","slogan","timeline","signup"]'
  )
  await page
    .getByRole("button", { name: "拖拽排序：预约" })
    .dragTo(organizer.locator('[data-section="slogan"]'), {
      targetPosition: { x: 40, y: 2 },
    })
  await expect(page.locator('input[name="sectionOrder"]')).toHaveValue(
    '["video","highlights","signup","slogan","timeline"]'
  )
  await page.getByRole("button", { name: "下移预约" }).click()
  await expect(page.locator('input[name="sectionOrder"]')).toHaveValue(
    '["video","highlights","slogan","signup","timeline"]'
  )

  const preview = page.locator(".preview-device-scroll .campaign-page").first()
  await page.locator("#preview-video").fill("https://example.com/preview.mp4")
  const visibleOrder = await preview.evaluate((campaignPage) =>
    Array.from(campaignPage.children)
      .map((element) => {
        if (element.classList.contains("campaign-page-video-section")) return "video"
        if (element.classList.contains("campaign-page-intro")) return "highlights"
        if (element.classList.contains("campaign-page-timeline")) return "timeline"
        if (element.classList.contains("campaign-page-marquee")) return "slogan"
        if (element.classList.contains("campaign-page-closing")) return "signup"
        return null
      })
      .filter(Boolean)
  )
  expect(visibleOrder).toEqual(["video", "highlights", "slogan", "signup", "timeline"])
  await page.getByRole("switch", { name: "演示视频", exact: true }).click()
  await expect(preview.locator(".campaign-page-video-section")).toHaveCount(0)
  await expect(page.locator('input[name="sectionVisibility"]')).toHaveValue(/"video":false/)

  await page.getByRole("switch", { name: "滚动标语" }).click()
  await expect(preview.locator(".campaign-page-marquee")).toHaveCount(0)

  const regionsToggle = page.getByRole("button", { name: "页面区域" })
  await regionsToggle.click()
  await expect(regionsToggle).toHaveAttribute("aria-expanded", "false")
  await expect(organizer).toBeHidden()
  await page.reload()
  await expect(page.getByRole("button", { name: "页面区域" })).toHaveAttribute(
    "aria-expanded",
    "false"
  )

  const highlightsTrigger = page.locator('#campaign-highlights [data-slot="collapsible-trigger"]')
  await expect(highlightsTrigger).toHaveAttribute("aria-expanded", "true")
  await highlightsTrigger.click()
  await expect(highlightsTrigger).toHaveAttribute("aria-expanded", "false")
  await expect(page.getByLabel("功能标题")).toBeHidden()
  await page.reload()
  await expect(
    page.locator('#campaign-highlights [data-slot="collapsible-trigger"]')
  ).toHaveAttribute("aria-expanded", "false")

  const previewFeatureTitle = page
    .locator('[data-preview-device="desktop"] [data-editor-target="feature-title"]')
    .first()
  const featureTitleField = page.locator('[data-preview-source="feature-title"]')
  const featureTitleControl = featureTitleField.locator("textarea")
  await previewFeatureTitle.click()
  // 预览点击后的高亮是瞬时状态，属性与派生样式必须在同一轮采样里读取，否则会错过窗口。
  await expect
    .poll(
      async () => {
        const highlighted = await featureTitleControl.getAttribute("data-editor-highlight")
        if (highlighted !== "true") {
          return null
        }
        const [fieldOutline, controlOutline, boxShadow] = await Promise.all([
          featureTitleField.evaluate((field) => getComputedStyle(field).outlineWidth),
          featureTitleControl.evaluate((control) => getComputedStyle(control).outlineWidth),
          featureTitleControl.evaluate((control) => getComputedStyle(control).boxShadow),
        ])
        return { boxShadow, controlOutline, fieldOutline }
      },
      { timeout: 5_000 }
    )
    .toEqual({
      boxShadow: expect.stringMatching(/2px inset/),
      controlOutline: "0px",
      fieldOutline: "0px",
    })
  await expect(
    page.locator('#campaign-highlights [data-slot="collapsible-trigger"]')
  ).toHaveAttribute("aria-expanded", "true")
  await expect(featureTitleField).toBeInViewport()

  await page.getByLabel("功能正文").focus()
  await expect
    .poll(() =>
      previewFeatureTitle.evaluate((element) => {
        const scrollElement = element.closest<HTMLElement>(".preview-device-scroll")
        if (!scrollElement) {
          return false
        }

        const elementRect = element.getBoundingClientRect()
        const scrollRect = scrollElement.getBoundingClientRect()
        return elementRect.top >= scrollRect.top && elementRect.bottom <= scrollRect.bottom
      })
    )
    .toBe(true)

  const stickyHeading = page.locator("#campaign-timeline .campaign-editor-section-header")
  await expect(stickyHeading).toHaveCSS("position", "sticky")
  await expect(stickyHeading).toHaveCSS("top", "0px")

  const workspaceMetrics = await page.locator(".campaign-studio").evaluate((studio) => {
    const editor = studio.querySelector("main")
    const config = editor?.querySelector("aside")
    return {
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      editorHeight: editor?.getBoundingClientRect().height ?? 0,
      configClientHeight: config?.clientHeight ?? 0,
      configScrollHeight: config?.scrollHeight ?? 0,
    }
  })
  expect(workspaceMetrics.documentHeight).toBeLessThanOrEqual(workspaceMetrics.viewportHeight + 1)
  expect(workspaceMetrics.editorHeight).toBeLessThan(workspaceMetrics.viewportHeight)
  expect(workspaceMetrics.configScrollHeight).toBeGreaterThan(workspaceMetrics.configClientHeight)
})

test("configures marquee content, looping, and speed", async ({ page }) => {
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  const preview = page.locator(".preview-device-scroll .campaign-page").first()
  await page.getByRole("textbox", { name: /品牌 Slogan/ }).fill("A brand line for the header")
  await page.getByLabel("滚动标语内容").fill("A separate moving release signal")

  await expect(preview.locator(".campaign-page-header-slogan")).toHaveText(
    "A brand line for the header"
  )
  await expect(preview.locator(".campaign-page-marquee")).toContainText(
    "A separate moving release signal"
  )

  await page.getByRole("switch", { name: "无限轮播" }).click()
  await expect(preview.locator(".campaign-page-marquee")).toHaveAttribute("data-infinite", "false")
  await expect(preview.locator(".campaign-page-marquee-track")).toHaveCSS("animation-name", "none")

  await page.getByRole("switch", { name: "无限轮播" }).click()
  const speedSlider = page.getByRole("slider", { name: "轮播速度" })
  await speedSlider.focus()
  await page.keyboard.press("Home")
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("ArrowRight")
  }
  await expect(page.locator('input[name="marquee"]')).toHaveValue(
    /"content":"A separate moving release signal","infinite":true,"speed":20/
  )
  await expect(preview.locator(".campaign-page-marquee-track")).toHaveCSS(
    "animation-duration",
    "20s"
  )
  await page.getByRole("switch", { name: "Header 显示品牌 Slogan" }).click()
  await expect(preview.locator(".campaign-page-header-slogan")).toHaveCount(0)
})

test("configures the campaign page header", async ({ page }) => {
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  await page.getByLabel("品牌名称").fill("NEXUS")
  await page.getByLabel("右侧标识").fill("NX-27")
  const preview = page.locator(".preview-device-scroll .campaign-page").first()
  await expect(preview.locator(".campaign-page-brand").first()).toContainText("NEXUS")
  await expect(preview.locator(".campaign-page-header-meta")).toContainText("NX-27")

  await page.getByRole("switch", { name: "显示品牌 Slogan" }).click()
  await expect(preview.locator(".campaign-page-header-slogan")).toHaveCount(0)
  await page.getByRole("switch", { name: "显示页面 Header" }).click()
  await expect(preview.locator(".campaign-page-header")).toHaveCount(0)
  await expect(page.locator('input[name="header"]')).toHaveValue(/"enabled":false/)
})

test("aligns midnight premiere subscription controls in the editor preview", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard/campaigns/demo-launch/edit")
  await page.getByRole("button", { name: "午夜首映：电影片头与夜色奢华" }).click()

  const emailRow = page
    .locator('[data-preview-device="desktop"] .campaign-subscribe-email-row')
    .first()
  await emailRow.scrollIntoViewIfNeeded()

  const metrics = await emailRow.evaluate((row) => {
    const field = row.querySelector(".campaign-subscribe-field")?.getBoundingClientRect()
    const button = row.querySelector(".campaign-subscribe-button")?.getBoundingClientRect()
    const panel = row.closest(".campaign-subscribe-email-panel")?.getBoundingClientRect()
    const fields = row.closest(".campaign-subscribe-fields")?.getBoundingClientRect()
    const form = row.closest(".campaign-subscribe")?.getBoundingClientRect()

    return {
      fieldHeight: field?.height ?? 0,
      fieldWidth: field?.width ?? 0,
      buttonHeight: button?.height ?? 0,
      topDifference: Math.abs((field?.top ?? 0) - (button?.top ?? 0)),
      bottomDifference: Math.abs((field?.bottom ?? 0) - (button?.bottom ?? 0)),
      centerDifference: Math.abs(
        (panel?.left ?? 0) + (panel?.width ?? 0) / 2 - ((form?.left ?? 0) + (form?.width ?? 0) / 2)
      ),
      panelWidth: panel?.width ?? 0,
      fieldsWidth: fields?.width ?? 0,
      fieldsCenterDifference: Math.abs(
        (fields?.left ?? 0) +
          (fields?.width ?? 0) / 2 -
          ((form?.left ?? 0) + (form?.width ?? 0) / 2)
      ),
      backgroundColor: row.querySelector(".campaign-subscribe-field")
        ? getComputedStyle(row.querySelector(".campaign-subscribe-field") as Element)
            .backgroundColor
        : "",
    }
  })

  expect(Math.abs(metrics.fieldHeight - metrics.buttonHeight)).toBeLessThan(1)
  expect(metrics.fieldHeight).toBeGreaterThanOrEqual(40)
  expect(metrics.fieldWidth).toBeGreaterThanOrEqual(300)
  expect(metrics.topDifference).toBeLessThan(1)
  expect(metrics.bottomDifference).toBeLessThan(1)
  expect(metrics.centerDifference).toBeLessThan(1)
  expect(metrics.panelWidth).toBeLessThanOrEqual(576)
  expect(metrics.fieldsWidth).toBeLessThanOrEqual(768)
  expect(metrics.fieldsCenterDifference).toBeLessThan(1)
  expect(metrics.backgroundColor).not.toBe("rgba(0, 0, 0, 0)")
  await page
    .locator('[data-preview-device="desktop"] .campaign-page-closing')
    .first()
    .screenshot({ path: testInfo.outputPath("subscription-column-centered.png") })
})

test("left aligns answers and keeps stacked subscription rows compact across templates", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/dashboard/campaigns/demo-launch/edit")

  const templateButtons = page.locator(".campaign-template-picker-item")
  await expect(templateButtons).toHaveCount(16)
  await page.getByRole("switch", { name: "显示倒计时" }).click()
  const countdownVisualSignatures = new Set<string>()
  const countdownScreenshots = new Map([
    [0, "countdown-orbit.png"],
    [8, "countdown-poster.png"],
    [11, "countdown-ticket.png"],
  ])

  for (let index = 0; index < 16; index += 1) {
    await templateButtons.nth(index).click()
    const preview = page.locator('[data-preview-device="desktop"] .campaign-page').first()
    const countdown = preview.locator(".campaign-page-countdown")
    await expect(countdown).toBeVisible()
    await expect(preview.locator(".campaign-question-label").first()).toHaveCSS(
      "text-align",
      "left"
    )
    await expect(preview.locator(".campaign-question-option").first()).toHaveCSS(
      "text-align",
      "left"
    )
    await expect(preview.locator(".campaign-question-answer").first()).toHaveCSS(
      "text-align",
      "left"
    )
    await expect(preview.locator(".campaign-subscribe-field").first()).not.toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)"
    )
    await expect(preview.locator("[data-campaign-closing-art]")).toHaveCount(1)
    const layoutMetrics = await preview.evaluate((campaignPage) => {
      const artwork = campaignPage.querySelector<HTMLElement>("[data-campaign-closing-art]")
      const copy = artwork?.closest<HTMLElement>(".campaign-page-closing-copy")
      const index = campaignPage.querySelector<HTMLElement>(".campaign-question-index")
      const label = campaignPage.querySelector<HTMLElement>(".campaign-question-label")
      const countdown = campaignPage.querySelector<HTMLElement>(".campaign-page-countdown")
      const countdownGrid = campaignPage.querySelector<HTMLElement>(".campaign-page-countdown-grid")
      const countdownCell = countdownGrid?.querySelector<HTMLElement>("div")
      const artworkRect = artwork?.getBoundingClientRect()
      const copyRect = copy?.getBoundingClientRect()
      const indexRect = index?.getBoundingClientRect()
      const labelRect = label?.getBoundingClientRect()
      const campaignRect = campaignPage.getBoundingClientRect()
      const countdownRect = countdown?.getBoundingClientRect()
      const indexStyle = index ? getComputedStyle(index) : null
      const countdownStyle = countdown ? getComputedStyle(countdown) : null
      const countdownGridStyle = countdownGrid ? getComputedStyle(countdownGrid) : null
      const countdownCellStyle = countdownCell ? getComputedStyle(countdownCell) : null

      return {
        artworkIsInsideCopy: Boolean(copy),
        artworkWithinCopy:
          (artworkRect?.left ?? 0) >= (copyRect?.left ?? 0) - 1 &&
          (artworkRect?.right ?? 0) <= (copyRect?.right ?? 0) + 1 &&
          (artworkRect?.top ?? 0) >= (copyRect?.top ?? 0) - 1 &&
          (artworkRect?.bottom ?? 0) <= (copyRect?.bottom ?? 0) + 1,
        indexCenterDifference: Math.abs(
          (indexRect?.top ?? 0) +
            (indexRect?.height ?? 0) / 2 -
            ((labelRect?.top ?? 0) + (labelRect?.height ?? 0) / 2)
        ),
        indexIsVisible:
          (indexRect?.width ?? 0) > 4 &&
          (indexRect?.height ?? 0) > 4 &&
          Number(indexStyle?.opacity ?? 0) > 0.9 &&
          indexStyle?.visibility !== "hidden",
        countdownWithinPage:
          (countdownRect?.left ?? 0) >= campaignRect.left - 1 &&
          (countdownRect?.right ?? 0) <= campaignRect.right + 1,
        countdownPaddingLeft: Number.parseFloat(countdownStyle?.paddingLeft ?? "0"),
        countdownOverflow: countdown
          ? Math.max(countdown.scrollWidth, countdown.clientWidth) - countdown.clientWidth
          : 0,
        countdownVisualSignature: [
          countdownStyle?.backgroundImage,
          countdownGridStyle?.backgroundColor,
          countdownGridStyle?.borderStyle,
          countdownGridStyle?.borderRadius,
          countdownGridStyle?.gridTemplateColumns,
          countdownCellStyle?.backgroundColor,
          countdownCellStyle?.borderRadius,
          countdownCellStyle?.transform,
        ].join("|"),
      }
    })
    expect(layoutMetrics.artworkIsInsideCopy).toBe(true)
    expect(layoutMetrics.artworkWithinCopy).toBe(true)
    expect(layoutMetrics.indexCenterDifference).toBeLessThan(2)
    expect(layoutMetrics.indexIsVisible).toBe(true)
    expect(layoutMetrics.countdownWithinPage).toBe(true)
    expect(layoutMetrics.countdownPaddingLeft).toBeGreaterThanOrEqual(16)
    expect(layoutMetrics.countdownOverflow).toBeLessThanOrEqual(1)
    countdownVisualSignatures.add(layoutMetrics.countdownVisualSignature)

    const screenshotName = countdownScreenshots.get(index)
    if (screenshotName) {
      await countdown.screenshot({ path: testInfo.outputPath(screenshotName) })
    }

    const firstOption = preview.locator(".campaign-question-option").first()
    await firstOption.hover()
    await page.waitForTimeout(220)
    const hoverContrast = await firstOption.evaluate((option) => {
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const context = canvas.getContext("2d", { willReadFrequently: true })

      function parseColor(color: string) {
        if (!context) {
          return [0, 0, 0, 0]
        }

        context.clearRect(0, 0, 1, 1)
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
        return [red, green, blue, alpha / 255]
      }

      function composite(foreground: number[], background: number[]) {
        const alpha = foreground[3] + background[3] * (1 - foreground[3])
        if (alpha === 0) {
          return [0, 0, 0, 0]
        }
        return [
          (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) /
            alpha,
          (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) /
            alpha,
          (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) /
            alpha,
          alpha,
        ]
      }

      function luminance(color: number[]) {
        const channels = color.map((value) => {
          const channel = value / 255
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
        })
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
      }

      const style = getComputedStyle(option)
      const ancestors: Element[] = []
      let current: Element | null = option
      while (current) {
        ancestors.push(current)
        current = current.parentElement
      }

      const effectiveBackground = ancestors
        .reverse()
        .reduce(
          (background, element) =>
            composite(parseColor(getComputedStyle(element).backgroundColor), background),
          [255, 255, 255, 1]
        )
      const effectiveForeground = composite(parseColor(style.color), effectiveBackground)
      const foreground = luminance(effectiveForeground)
      const background = luminance(effectiveBackground)
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
    })
    expect(hoverContrast).toBeGreaterThan(3)

    const tallestHighlight = await preview
      .locator(".campaign-page-highlights article")
      .evaluateAll((articles) =>
        Math.max(...articles.map((article) => article.getBoundingClientRect().height), 0)
      )
    expect(tallestHighlight).toBeLessThan(280)
  }

  expect(countdownVisualSignatures.size).toBeGreaterThanOrEqual(7)

  await page.getByRole("button", { name: "未来档案：明亮留白与杂志秩序" }).click()
  const stackedPreview = page.locator('[data-preview-device="desktop"] .campaign-page').first()
  const compactMetrics = await stackedPreview.evaluate((campaignPage) => {
    const subscription = campaignPage.querySelector(".campaign-page-subscription")
    const emailRow = campaignPage.querySelector(".campaign-subscribe-email-row")
    const closing = campaignPage.querySelector(".campaign-page-closing")
    const closingGrid = campaignPage.querySelector(".campaign-page-closing-grid")

    return {
      subscriptionWidth: subscription?.getBoundingClientRect().width ?? 0,
      emailRowWidth: emailRow?.getBoundingClientRect().width ?? 0,
      closingPaddingTop: closing ? Number.parseFloat(getComputedStyle(closing).paddingTop) : 0,
      closingGridColumns: closingGrid ? getComputedStyle(closingGrid).gridTemplateColumns : "",
      closingGridWidth: closingGrid?.getBoundingClientRect().width ?? 0,
    }
  })

  expect(compactMetrics.emailRowWidth).toBeLessThan(compactMetrics.subscriptionWidth)
  expect(compactMetrics.emailRowWidth).toBeLessThanOrEqual(672)
  expect(compactMetrics.closingPaddingTop).toBeLessThanOrEqual(96)
  expect(compactMetrics.closingGridColumns.split(" ")).toHaveLength(1)
  expect(compactMetrics.closingGridWidth).toBeLessThanOrEqual(864)

  await stackedPreview.locator(".campaign-subscribe-email-row").scrollIntoViewIfNeeded()
  await page.screenshot({
    path: testInfo.outputPath("campaign-stacked-closing.png"),
    fullPage: false,
  })

  await page.getByRole("button", { name: "预览模式" }).click()
  await page.getByRole("button", { name: "手机预览" }).click()
  const mobilePreview = page.locator('[data-preview-device="mobile"] .campaign-page').first()

  for (let index = 0; index < 16; index += 1) {
    await templateButtons.nth(index).click()
    await expect(mobilePreview.locator("[data-campaign-closing-art]")).toHaveCount(1)
    await expect(mobilePreview.locator(".campaign-page-countdown")).toBeVisible()
    const mobileTemplateMetrics = await mobilePreview.evaluate((campaignPage) => {
      const artwork = campaignPage.querySelector<HTMLElement>("[data-campaign-closing-art]")
      const copy = artwork?.closest<HTMLElement>(".campaign-page-closing-copy")
      const index = campaignPage.querySelector<HTMLElement>(".campaign-question-index")
      const label = campaignPage.querySelector<HTMLElement>(".campaign-question-label")
      const countdown = campaignPage.querySelector<HTMLElement>(".campaign-page-countdown")
      const countdownGrid = campaignPage.querySelector<HTMLElement>(".campaign-page-countdown-grid")
      const indexRect = index?.getBoundingClientRect()
      const labelRect = label?.getBoundingClientRect()
      const pageRect = campaignPage.getBoundingClientRect()
      const overflowElements = Array.from(campaignPage.querySelectorAll<HTMLElement>("*"))
        .flatMap((element) => {
          const rect = element.getBoundingClientRect()
          if (rect.left >= pageRect.left - 1 && rect.right <= pageRect.right + 1) {
            return []
          }

          return [
            {
              className: element.className,
              left: Math.round(rect.left - pageRect.left),
              right: Math.round(rect.right - pageRect.right),
            },
          ]
        })
        .slice(0, 8)

      return {
        template: campaignPage.dataset.template,
        artworkPosition: artwork ? getComputedStyle(artwork).position : "",
        artworkWithinCopy: artwork?.parentElement === copy,
        indexCenterDifference: Math.abs(
          (indexRect?.top ?? 0) +
            (indexRect?.height ?? 0) / 2 -
            ((labelRect?.top ?? 0) + (labelRect?.height ?? 0) / 2)
        ),
        countdownColumns: countdownGrid
          ? getComputedStyle(countdownGrid).gridTemplateColumns.split(" ").length
          : 0,
        countdownPaddingLeft: countdown
          ? Number.parseFloat(getComputedStyle(countdown).paddingLeft)
          : 0,
        overflow: campaignPage.scrollWidth - campaignPage.clientWidth,
        overflowElements,
      }
    })

    expect(mobileTemplateMetrics.artworkPosition).toBe("absolute")
    expect(mobileTemplateMetrics.artworkWithinCopy).toBe(true)
    expect(mobileTemplateMetrics.indexCenterDifference).toBeLessThan(2)
    expect(mobileTemplateMetrics.countdownColumns).toBe(2)
    expect(mobileTemplateMetrics.countdownPaddingLeft).toBeGreaterThanOrEqual(16)
    expect(
      mobileTemplateMetrics.overflow,
      JSON.stringify(mobileTemplateMetrics, null, 2)
    ).toBeLessThanOrEqual(1)

    if (index === 0) {
      await mobilePreview
        .locator(".campaign-page-countdown")
        .screenshot({ path: testInfo.outputPath("countdown-orbit-mobile.png") })
    }
  }
})

test("renders configurable header credit and equal subscription controls", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/p/ahead-2-preview")

  await expect(page.locator(".campaign-page-header-slogan")).toHaveText(
    "Make what's next worth waiting for."
  )
  await expect(page.locator(".campaign-page-footer")).toContainText("MADE WITH AHEAD")
  await expect(page.locator(".campaign-page-footer-description")).toHaveText(
    "开源功能预告与预约订阅系统"
  )
  await expect(page.getByRole("link", { name: "在 GitHub 上查看 Ahead" })).toHaveAttribute(
    "href",
    productConfig.productCredit.githubUrl
  )
  await expect(page.locator(".campaign-page-footer-year")).toHaveText("2026")
  await expect(page.locator(".campaign-page-footer-actions > :last-child")).toHaveAttribute(
    "href",
    productConfig.productCredit.githubUrl
  )

  const controlMetrics = await page.locator(".campaign-subscribe-email-row").evaluate((row) => {
    const field = row.querySelector(".campaign-subscribe-field")?.getBoundingClientRect()
    const buttonElement = row.querySelector(".campaign-subscribe-button")
    const button = buttonElement?.getBoundingClientRect()

    return {
      fieldHeight: field?.height ?? 0,
      fieldWidth: field?.width ?? 0,
      buttonHeight: button?.height ?? 0,
      buttonFontSize: buttonElement
        ? Number.parseFloat(getComputedStyle(buttonElement).fontSize)
        : 0,
      topDifference: Math.abs((field?.top ?? 0) - (button?.top ?? 0)),
      rowWidth: row.getBoundingClientRect().width,
      contentWidth: Math.max(row.scrollWidth, row.clientWidth),
    }
  })
  expect(Math.abs(controlMetrics.fieldHeight - controlMetrics.buttonHeight)).toBeLessThan(1)
  expect(controlMetrics.topDifference).toBeLessThan(1)
  expect(controlMetrics.fieldHeight).toBeGreaterThanOrEqual(48)
  expect(controlMetrics.fieldWidth).toBeGreaterThanOrEqual(360)
  expect(controlMetrics.buttonFontSize).toBeGreaterThanOrEqual(14)
  expect(controlMetrics.rowWidth).toBeLessThanOrEqual(672)
  expect(controlMetrics.contentWidth).toBeLessThanOrEqual(controlMetrics.rowWidth + 1)
  await expect(page.locator(".campaign-subscribe-email-feedback")).toHaveCount(0)

  const questionnaireMetrics = await page.locator(".campaign-page-closing").evaluate((closing) => {
    const form = closing.querySelector(".campaign-subscribe")
    const questions = Array.from(closing.querySelectorAll(".campaign-question")).map((question) =>
      question.getBoundingClientRect()
    )
    const emailRow = closing.querySelector(".campaign-subscribe-email-row")?.getBoundingClientRect()
    const grid = closing.querySelector(".campaign-page-closing-grid")
    const fields = closing.querySelector(".campaign-subscribe-fields")?.getBoundingClientRect()
    const formRect = form?.getBoundingClientRect()

    return {
      closingHeight: closing.getBoundingClientRect().height,
      gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0,
      emailRowWidth: emailRow?.width ?? 0,
      firstQuestionTop: questions[0]?.top ?? 0,
      secondQuestionTop: questions[1]?.top ?? 0,
      firstQuestionBottom: questions[0]?.bottom ?? 0,
      firstQuestionWidth: questions[0]?.width ?? 0,
      textQuestionWidth: questions[2]?.width ?? 0,
      formWidth: formRect?.width ?? 0,
      fieldsWidth: fields?.width ?? 0,
      fieldsCenterDifference: Math.abs(
        (fields?.left ?? 0) +
          (fields?.width ?? 0) / 2 -
          ((formRect?.left ?? 0) + (formRect?.width ?? 0) / 2)
      ),
      questionBodyColumns: closing.querySelector(".campaign-question-body")
        ? getComputedStyle(
            closing.querySelector(".campaign-question-body") as Element
          ).gridTemplateColumns.split(" ").length
        : 0,
      optionsStacked: Array.from(closing.querySelectorAll(".campaign-question-options")).every(
        (options) => {
          const optionRects = Array.from(options.querySelectorAll(".campaign-question-option")).map(
            (option) => option.getBoundingClientRect()
          )
          return optionRects.every(
            (option, index) =>
              Math.abs(option.width - options.getBoundingClientRect().width) < 1 &&
              (index === 0 || option.top > optionRects[index - 1].bottom)
          )
        }
      ),
    }
  })
  expect(questionnaireMetrics.gridColumns).toBe(2)
  expect(questionnaireMetrics.closingHeight).toBeLessThan(1000)
  expect(questionnaireMetrics.emailRowWidth).toBeLessThanOrEqual(672)
  expect(questionnaireMetrics.secondQuestionTop).toBeGreaterThan(
    questionnaireMetrics.firstQuestionBottom
  )
  expect(questionnaireMetrics.fieldsWidth).toBeLessThanOrEqual(768)
  expect(questionnaireMetrics.fieldsWidth).toBeLessThan(questionnaireMetrics.formWidth)
  expect(questionnaireMetrics.fieldsCenterDifference).toBeLessThan(1)
  expect(questionnaireMetrics.firstQuestionWidth).toBeCloseTo(questionnaireMetrics.fieldsWidth, 0)
  expect(questionnaireMetrics.textQuestionWidth).toBeCloseTo(questionnaireMetrics.fieldsWidth, 0)
  expect(questionnaireMetrics.questionBodyColumns).toBe(1)
  expect(questionnaireMetrics.optionsStacked).toBe(true)

  await page.locator(".campaign-subscribe-email-row").scrollIntoViewIfNeeded()
  await page.screenshot({
    path: testInfo.outputPath("campaign-public-desktop.png"),
    fullPage: false,
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page
        .locator(".campaign-page-header-slogan")
        .evaluate((element) => getComputedStyle(element).visibility)
    )
    .toBe("visible")
  await expect(page.locator(".campaign-page-footer-slogan")).toHaveText("MADE WITH AHEAD")
  const mobileOverflow = await page
    .locator(".campaign-page")
    .evaluate((campaignPage) => campaignPage.scrollWidth - campaignPage.clientWidth)
  expect(mobileOverflow).toBeLessThanOrEqual(1)
  const mobileControlHeights = await page
    .locator(".campaign-subscribe-email-row")
    .evaluate((row) => ({
      field: row.querySelector(".campaign-subscribe-field")?.getBoundingClientRect().height ?? 0,
      button: row.querySelector(".campaign-subscribe-button")?.getBoundingClientRect().height ?? 0,
    }))
  expect(Math.abs(mobileControlHeights.field - mobileControlHeights.button)).toBeLessThan(1)

  await page.evaluate(() => window.scrollTo({ top: 0 }))
  await page.screenshot({
    path: testInfo.outputPath("campaign-public-mobile.png"),
    fullPage: false,
  })
})

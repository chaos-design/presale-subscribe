import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { productConfig } from "@/lib/product-config"

export const alt = `${productConfig.name}：${productConfig.slogan}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// 只有 flexbox 与部分 CSS 属性可用；Satori 内置 Geist，无法渲染中文字形，因此 OG 文案使用英文。
const seal = await readFile(join(process.cwd(), "public/brand/reps-mark.svg"))
const sealUri = `data:image/svg+xml;base64,${seal.toString("base64")}`

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#080a09",
        color: "#f7f7f2",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px 80px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, opacity: 0.5 }}>
          OPEN SOURCE · APACHE-2.0
        </div>
      </div>

      <div style={{ alignItems: "center", display: "flex", gap: 48 }}>
        {/* biome-ignore lint/performance/noImgElement: Satori rasterizes the seal from a data URI */}
        <img alt="" height={240} src={sealUri} width={240} />
        <div
          style={{
            borderLeft: "1px solid rgba(247,247,242,0.16)",
            display: "flex",
            flexDirection: "column",
            gap: 22,
            paddingLeft: 48,
          }}
        >
          <div style={{ display: "flex", fontSize: 104, letterSpacing: 6 }}>
            {productConfig.wordmark}
          </div>
          <div style={{ color: "#c6ff3e", display: "flex", fontSize: 34, letterSpacing: 3 }}>
            {productConfig.slogan.toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize: 21, letterSpacing: 2, opacity: 0.45 }}>
            {productConfig.stages.map((stage) => stage.toUpperCase()).join(" · ")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, opacity: 0.6 }}>
        {productConfig.description}
      </div>
    </div>,
    { ...size }
  )
}

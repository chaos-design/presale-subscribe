import Link from "next/link"

import { productConfig } from "@/lib/product-config"
import { cn } from "@/lib/utils"

export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <Link
      href={productConfig.homePath}
      className={cn("inline-flex items-center gap-2 font-mono text-sm font-medium", className)}
      aria-label={`${productConfig.name} 首页`}
    >
      {/* biome-ignore lint/performance/noImgElement: the seal has fixed colors and must stay an SVG asset */}
      <img src="/brand/reps-mark.svg" alt="" className="brand-mark-seal size-7" />
      {compact ? null : <span className="brand-mark-wordmark">{productConfig.wordmark}</span>}
    </Link>
  )
}

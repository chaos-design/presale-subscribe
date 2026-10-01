import { RadarIcon } from "lucide-react"
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
      <span className="brand-mark-icon flex size-7 items-center justify-center rounded-md bg-foreground text-background">
        <RadarIcon className="size-4" aria-hidden="true" />
      </span>
      {compact ? null : <span className="brand-mark-wordmark">{productConfig.wordmark}</span>}
    </Link>
  )
}

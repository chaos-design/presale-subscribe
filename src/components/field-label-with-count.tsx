import type { ComponentProps } from "react"

import { FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface FieldLabelWithCountProps extends ComponentProps<typeof FieldLabel> {
  count: number
  max: number
}

export function FieldLabelWithCount({
  children,
  className,
  count,
  max,
  ...props
}: FieldLabelWithCountProps) {
  return (
    <FieldLabel
      className={cn("flex w-full items-baseline justify-between gap-3", className)}
      {...props}
    >
      <span>{children}</span>
      <span className="shrink-0 font-mono text-[9px] font-normal text-muted-foreground">
        {count} / {max}
      </span>
    </FieldLabel>
  )
}

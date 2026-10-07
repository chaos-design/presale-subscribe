"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingLabel?: string
  pendingIntent?: string | null
}

export function SubmitButton({
  children,
  pendingLabel = "处理中",
  disabled,
  pendingIntent,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  // 同一个表单内所有提交按钮都会禁用，但只有触发本次提交的按钮显示加载态。
  const isSubmitting =
    pending && (pendingIntent === undefined || String(props.value) === pendingIntent)

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
      {isSubmitting ? pendingLabel : children}
    </Button>
  )
}

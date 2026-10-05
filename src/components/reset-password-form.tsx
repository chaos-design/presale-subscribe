"use client"

import { ShieldCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useMemo, useState } from "react"

import { PasswordInput } from "@/components/password-input"
import { PasswordStrength } from "@/components/password-strength"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { getAuthErrorMessage } from "@/lib/auth-error"
import { getPasswordStrength } from "@/lib/password-strength"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function ResetPasswordForm({ nextPath }: { nextPath: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    if (!supabase) {
      setError("请先配置 Supabase 环境变量")
      return
    }
    if (password.length < 8) {
      setError("密码至少需要 8 个字符")
      return
    }
    if (!getPasswordStrength(password).isStrong) {
      setError("请让密码满足长度要求，并至少包含大小写字母、数字或符号中的两类")
      return
    }
    if (password !== confirmation) {
      setError("两次输入的密码不一致")
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        throw updateError
      }
      router.replace(nextPath)
      router.refresh()
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError))
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="new-password">新密码</FieldLabel>
          <PasswordInput
            id="new-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(value) => {
              setPassword(value)
              setError("")
            }}
            ariaInvalid={Boolean(error)}
          />
          <PasswordStrength password={password} />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="password-confirmation">确认新密码</FieldLabel>
          <PasswordInput
            id="password-confirmation"
            name="confirmation"
            autoComplete="new-password"
            value={confirmation}
            onChange={(value) => {
              setConfirmation(value)
              setError("")
            }}
            ariaInvalid={Boolean(error)}
          />
          <FieldDescription>
            {confirmation.length === 0
              ? "请再次输入密码。"
              : confirmation === password
                ? "两次密码一致。"
                : "两次密码暂不一致。"}
          </FieldDescription>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
        <Button type="submit" size="lg" className="h-11" disabled={isSubmitting || !supabase}>
          {isSubmitting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <ShieldCheckIcon data-icon="inline-start" aria-hidden="true" />
          )}
          更新密码
        </Button>
      </FieldGroup>
    </form>
  )
}

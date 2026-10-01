"use client"

import { MailIcon } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getAuthErrorMessage } from "@/lib/auth-error"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export function ForgotPasswordForm({ nextPath }: { nextPath: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!supabase) {
      setError("请先配置 Supabase 环境变量")
      return
    }

    setIsSubmitting(true)
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    callbackUrl.searchParams.set("next", `/reset-password?next=${encodeURIComponent(nextPath)}`)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl.toString(),
      })
      if (resetError) {
        throw resetError
      }
      setSent(true)
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="reset-email">邮箱</FieldLabel>
          <Input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-11"
            aria-invalid={Boolean(error)}
            required
          />
          <FieldDescription>如该邮箱已注册，系统会发送一次性重置链接。</FieldDescription>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
        {sent ? (
          <FieldDescription role="status">
            请求已提交，请检查邮箱中的密码重置邮件。
          </FieldDescription>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="h-11"
          disabled={isSubmitting || sent || !supabase}
        >
          {isSubmitting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <MailIcon data-icon="inline-start" aria-hidden="true" />
          )}
          发送重置邮件
        </Button>
      </FieldGroup>
    </form>
  )
}

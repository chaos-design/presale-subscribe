"use client"

import { CircleAlertIcon, CircleCheckIcon, SaveIcon } from "lucide-react"
import { useActionState } from "react"

import { updateProfileAction } from "@/app/dashboard/actions"
import { SubmitButton } from "@/components/submit-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { initialActionState } from "@/lib/validation"

export function AccountForm({ email, initialName }: { email: string; initialName: string }) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.fullName)}>
          <FieldLabel htmlFor="full-name">显示名称</FieldLabel>
          <Input
            id="full-name"
            name="fullName"
            defaultValue={initialName}
            minLength={2}
            maxLength={48}
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.fullName)}
            required
          />
          <FieldDescription>用于工作台导航和账号标识。</FieldDescription>
          <FieldError errors={state.fieldErrors?.fullName?.map((message) => ({ message }))} />
        </Field>
        <Field data-disabled>
          <FieldLabel htmlFor="account-email">登录邮箱</FieldLabel>
          <Input id="account-email" type="email" value={email} className="h-11" disabled readOnly />
          <FieldDescription>邮箱是当前账号的登录身份，暂不支持在应用内修改。</FieldDescription>
        </Field>
      </FieldGroup>

      {state.status !== "idle" ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          {state.status === "error" ? (
            <CircleAlertIcon aria-hidden="true" />
          ) : (
            <CircleCheckIcon aria-hidden="true" />
          )}
          <AlertTitle>{state.status === "error" ? "更新失败" : "已保存"}</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton size="lg" className="h-11 w-fit" pendingLabel="保存中">
        <SaveIcon data-icon="inline-start" aria-hidden="true" />
        保存资料
      </SubmitButton>
    </form>
  )
}

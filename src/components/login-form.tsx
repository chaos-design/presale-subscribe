"use client"

import {
  ArrowRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  LinkIcon,
  MailCheckIcon,
  SendIcon,
  UserPlusIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react"

import { PasswordInput } from "@/components/password-input"
import { PasswordStrength } from "@/components/password-strength"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAuthErrorMessage } from "@/lib/auth-error"
import { getPasswordStrength } from "@/lib/password-strength"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type AuthView = "login" | "register"
type LoginMethod = "password" | "otp"
type AuthErrorTarget =
  | "confirmPassword"
  | "form"
  | "legal"
  | "otpEmail"
  | "otpToken"
  | "password"
  | "passwordEmail"
  | "registerEmail"
  | "registerPassword"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function AuthFeedback({
  error,
  message,
  messageTitle,
}: {
  error: string
  message: string
  messageTitle: string
}) {
  if (error) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>操作未完成</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (message) {
    return (
      <Alert>
        <CircleCheckIcon aria-hidden="true" />
        <AlertTitle>{messageTitle}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    )
  }

  return null
}

function AuthFieldHeader({
  error,
  htmlFor,
  label,
  action,
}: {
  error?: string
  htmlFor: string
  label: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
        <FieldLabel
          htmlFor={htmlFor}
          className="shrink-0 text-[15px] font-semibold text-foreground"
        >
          {label}
        </FieldLabel>
        {error ? (
          <span
            className="min-w-0 text-xs leading-tight font-normal text-destructive"
            data-error-for={htmlFor}
            role="alert"
          >
            {error}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function LegalAcceptance({
  checked,
  error,
  id,
  onCheckedChange,
}: {
  checked: boolean
  error?: string
  id: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Field orientation="horizontal" className="items-start">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <FieldLabel
        htmlFor={id}
        className="flex flex-wrap gap-x-1 gap-y-0 font-normal text-muted-foreground"
      >
        <span>我已阅读并同意</span>
        <Link href="/terms" className="font-medium text-foreground hover:text-primary">
          《服务条款》
        </Link>
        <span>与</span>
        <Link href="/privacy" className="font-medium text-foreground hover:text-primary">
          《隐私政策》
        </Link>
        {error ? (
          <span className="text-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </FieldLabel>
    </Field>
  )
}

export function LoginForm({
  nextPath,
  initialError = "",
  initialLoginMethod = "password",
  initialView = "login",
}: {
  nextPath: string
  initialError?: string
  initialLoginMethod?: LoginMethod
  initialView?: AuthView
}) {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const otpInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<AuthView>(initialView)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(initialLoginMethod)
  const [passwordEmail, setPasswordEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpEmail, setOtpEmail] = useState("")
  const [otpToken, setOtpToken] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState(false)
  const [error, setError] = useState(initialError)
  const [errorTarget, setErrorTarget] = useState<AuthErrorTarget | null>(
    initialError ? "form" : null
  )
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldown])

  function clearFeedback() {
    setError("")
    setErrorTarget(null)
    setMessage("")
  }

  function setFieldError(target: AuthErrorTarget, nextError: string) {
    setError(nextError)
    setErrorTarget(target)
    setMessage("")
  }

  function fieldError(target: AuthErrorTarget) {
    return errorTarget === target ? error : ""
  }

  function changeLegalAcceptance(checked: boolean) {
    setAcceptedLegalTerms(checked)
    if (checked) {
      clearFeedback()
    }
  }

  function ensureLegalAccepted() {
    if (acceptedLegalTerms) {
      return true
    }
    setFieldError("legal", "请先同意条款")
    return false
  }

  function changeView(value: string) {
    setView(value === "register" ? "register" : "login")
    clearFeedback()
  }

  function changeLoginMethod(value: string) {
    setLoginMethod(value === "otp" ? "otp" : "password")
    clearFeedback()
  }

  function getCallbackUrl() {
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    callbackUrl.searchParams.set("next", nextPath)
    return callbackUrl.toString()
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = passwordEmail.trim()

    clearFeedback()

    if (!ensureLegalAccepted()) {
      return
    }

    if (!isValidEmail(email)) {
      setFieldError("passwordEmail", "请输入有效邮箱")
      return
    }

    if (!password) {
      setFieldError("password", "请输入密码")
      return
    }

    if (!supabase) {
      setFieldError("form", "请先配置 Supabase 环境变量")
      return
    }

    setIsSubmitting(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      router.replace(nextPath)
      router.refresh()
    } catch (signInError) {
      setFieldError("password", getAuthErrorMessage(signInError))
      setIsSubmitting(false)
    }
  }

  async function sendOtp() {
    const email = otpEmail.trim()

    clearFeedback()

    if (!ensureLegalAccepted()) {
      return
    }

    if (!isValidEmail(email)) {
      setFieldError("otpEmail", "请输入有效邮箱")
      return
    }

    if (!supabase) {
      setFieldError("form", "请先配置 Supabase 环境变量")
      return
    }

    setIsSendingOtp(true)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (otpError) {
        throw otpError
      }

      setOtpEmail(email)
      setCooldown(60)
      setMessage("登录验证码已发送，请查收邮件。60 秒后可再次发送。")
      window.requestAnimationFrame(() => otpInputRef.current?.focus())
    } catch (otpError) {
      setFieldError("otpEmail", getAuthErrorMessage(otpError))
    } finally {
      setIsSendingOtp(false)
    }
  }

  async function handleOtpLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = otpEmail.trim()
    const token = otpToken.trim()

    clearFeedback()

    if (!ensureLegalAccepted()) {
      return
    }

    if (!isValidEmail(email)) {
      setFieldError("otpEmail", "请输入有效邮箱")
      return
    }

    if (!/^\d+$/.test(token)) {
      setFieldError("otpToken", "请输入数字验证码")
      return
    }

    if (!supabase) {
      setFieldError("form", "请先配置 Supabase 环境变量")
      return
    }

    setIsSubmitting(true)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      })

      if (verifyError) {
        throw verifyError
      }

      router.replace(nextPath)
      router.refresh()
    } catch (verifyError) {
      setFieldError("otpToken", getAuthErrorMessage(verifyError))
      setIsSubmitting(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = registerEmail.trim()

    clearFeedback()

    if (!ensureLegalAccepted()) {
      return
    }

    if (!isValidEmail(email)) {
      setFieldError("registerEmail", "请输入有效邮箱")
      return
    }

    if (registerPassword.length < 8) {
      setFieldError("registerPassword", "至少需要 8 个字符")
      return
    }

    if (!getPasswordStrength(registerPassword).isStrong) {
      setFieldError("registerPassword", "请满足密码强度要求")
      return
    }

    if (registerPassword !== confirmPassword) {
      setFieldError("confirmPassword", "两次输入不一致")
      return
    }

    if (!supabase) {
      setFieldError("form", "请先配置 Supabase 环境变量")
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: registerPassword,
        options: {
          emailRedirectTo: getCallbackUrl(),
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data.session) {
        router.replace(nextPath)
        router.refresh()
        return
      }

      setRegisterEmail(email)
      setRegisterPassword("")
      setConfirmPassword("")
      setMessage("确认链接已发送到你的邮箱。打开链接完成验证后，将自动登录 Ahead。")
      setIsSubmitting(false)
    } catch (signUpError) {
      setFieldError("registerEmail", getAuthErrorMessage(signUpError))
      setIsSubmitting(false)
    }
  }

  const confirmPasswordError =
    fieldError("confirmPassword") ||
    (confirmPassword && confirmPassword !== registerPassword ? "两次输入不一致" : "")

  return (
    <div className="flex flex-col gap-5">
      <Tabs value={view} onValueChange={changeView} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">登录</TabsTrigger>
          <TabsTrigger value="register">注册</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="pt-5">
          <Tabs value={loginMethod} onValueChange={changeLoginMethod} className="w-full">
            <TabsList variant="line" className="hidden" aria-hidden="true">
              <TabsTrigger value="password">
                <KeyRoundIcon data-icon="inline-start" aria-hidden="true" />
                账号密码
              </TabsTrigger>
              <TabsTrigger value="otp">
                <MailCheckIcon data-icon="inline-start" aria-hidden="true" />
                邮箱验证码
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5" noValidate>
                <FieldGroup>
                  <Field data-invalid={Boolean(fieldError("passwordEmail"))}>
                    <AuthFieldHeader
                      htmlFor="password-email"
                      label="邮箱"
                      error={fieldError("passwordEmail")}
                    />
                    <InputGroup className="h-11">
                      <InputGroupInput
                        id="password-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="请输入登录邮箱"
                        className="h-full placeholder:text-xs"
                        value={passwordEmail}
                        onChange={(event) => {
                          setPasswordEmail(event.target.value)
                          clearFeedback()
                        }}
                        aria-invalid={Boolean(fieldError("passwordEmail"))}
                        required
                      />
                    </InputGroup>
                  </Field>
                  <Field data-invalid={Boolean(fieldError("password"))}>
                    <AuthFieldHeader
                      htmlFor="login-password"
                      label="密码"
                      error={fieldError("password")}
                      action={
                        <Link
                          href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
                          className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:underline"
                        >
                          忘记密码
                        </Link>
                      }
                    />
                    <PasswordInput
                      id="login-password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(value) => {
                        setPassword(value)
                        clearFeedback()
                      }}
                      ariaInvalid={Boolean(fieldError("password"))}
                    />
                  </Field>
                </FieldGroup>

                <AuthFeedback
                  error={fieldError("form")}
                  message={message}
                  messageTitle="登录成功"
                />

                <LegalAcceptance
                  id="password-legal-acceptance"
                  checked={acceptedLegalTerms}
                  error={fieldError("legal")}
                  onCheckedChange={changeLegalAcceptance}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="h-11"
                  disabled={isSubmitting || !supabase || !acceptedLegalTerms}
                >
                  {isSubmitting ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <KeyRoundIcon data-icon="inline-start" aria-hidden="true" />
                  )}
                  登录工作台
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <form onSubmit={handleOtpLogin} className="flex flex-col gap-5" noValidate>
                <FieldGroup>
                  <Field data-invalid={Boolean(fieldError("otpEmail"))}>
                    <AuthFieldHeader
                      htmlFor="otp-email"
                      label="邮箱"
                      error={fieldError("otpEmail")}
                    />
                    <InputGroup className="h-11">
                      <InputGroupInput
                        id="otp-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="请输入已注册邮箱"
                        className="h-full placeholder:text-xs"
                        value={otpEmail}
                        onChange={(event) => {
                          setOtpEmail(event.target.value)
                          setOtpToken("")
                          clearFeedback()
                        }}
                        aria-invalid={Boolean(fieldError("otpEmail"))}
                        required
                      />
                    </InputGroup>
                  </Field>
                  <Field data-invalid={Boolean(fieldError("otpToken"))}>
                    <AuthFieldHeader
                      htmlFor="otp-token"
                      label="验证码"
                      error={fieldError("otpToken")}
                      action={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSendingOtp || cooldown > 0 || !acceptedLegalTerms}
                          onClick={() => void sendOtp()}
                        >
                          {isSendingOtp ? (
                            <Spinner data-icon="inline-start" />
                          ) : (
                            <SendIcon data-icon="inline-start" aria-hidden="true" />
                          )}
                          {cooldown > 0 ? `${cooldown}s 后重发` : "获取验证码"}
                        </Button>
                      }
                    />
                    <InputGroup className="h-11">
                      <InputGroupInput
                        ref={otpInputRef}
                        id="otp-token"
                        name="token"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]+"
                        placeholder="请输入邮件中的数字验证码"
                        value={otpToken}
                        onChange={(event) => {
                          setOtpToken(event.target.value.replace(/\D/g, ""))
                          clearFeedback()
                        }}
                        className="h-full font-mono text-base tracking-[0.35em] placeholder:text-xs placeholder:tracking-normal"
                        aria-invalid={Boolean(fieldError("otpToken"))}
                        required
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>

                <AuthFeedback
                  error={fieldError("form")}
                  message={message}
                  messageTitle="验证码已发送"
                />

                <LegalAcceptance
                  id="otp-legal-acceptance"
                  checked={acceptedLegalTerms}
                  error={fieldError("legal")}
                  onCheckedChange={changeLegalAcceptance}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="h-11"
                  disabled={isSubmitting || !supabase || !acceptedLegalTerms}
                >
                  {isSubmitting ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <MailCheckIcon data-icon="inline-start" aria-hidden="true" />
                  )}
                  验证并登录
                  <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="register" className="pt-5">
          <form onSubmit={handleRegister} className="flex flex-col gap-5" noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(fieldError("registerEmail"))}>
                <AuthFieldHeader
                  htmlFor="register-email"
                  label="邮箱"
                  error={fieldError("registerEmail")}
                />
                <InputGroup className="h-11">
                  <InputGroupInput
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="请输入常用邮箱"
                    className="h-full placeholder:text-xs"
                    value={registerEmail}
                    onChange={(event) => {
                      setRegisterEmail(event.target.value)
                      clearFeedback()
                    }}
                    aria-invalid={Boolean(fieldError("registerEmail"))}
                    required
                  />
                </InputGroup>
              </Field>
              <Field data-invalid={Boolean(fieldError("registerPassword"))}>
                <AuthFieldHeader
                  htmlFor="register-password"
                  label="设置密码"
                  error={fieldError("registerPassword")}
                />
                <PasswordInput
                  id="register-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="至少 8 位，并包含两类字符"
                  value={registerPassword}
                  onChange={(value) => {
                    setRegisterPassword(value)
                    clearFeedback()
                  }}
                  ariaInvalid={Boolean(fieldError("registerPassword"))}
                />
                <PasswordStrength password={registerPassword} />
              </Field>
              <Field data-invalid={Boolean(confirmPasswordError)}>
                <AuthFieldHeader
                  htmlFor="confirm-password"
                  label="确认密码"
                  error={confirmPasswordError}
                />
                <PasswordInput
                  id="confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value)
                    clearFeedback()
                  }}
                  ariaInvalid={Boolean(confirmPasswordError)}
                />
              </Field>
            </FieldGroup>

            <AuthFeedback
              error={fieldError("form")}
              message={message}
              messageTitle="确认链接已发送"
            />

            <LegalAcceptance
              id="register-legal-acceptance"
              checked={acceptedLegalTerms}
              error={fieldError("legal")}
              onCheckedChange={changeLegalAcceptance}
            />

            <Button
              type="submit"
              size="lg"
              className="h-11"
              disabled={isSubmitting || !supabase || !acceptedLegalTerms}
            >
              {isSubmitting ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
              )}
              创建账号
              <LinkIcon data-icon="inline-end" aria-hidden="true" />
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

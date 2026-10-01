const authErrorMessages: Array<[RegExp, string]> = [
  [/signups not allowed for otp|user not found/i, "该邮箱尚未注册，请先创建账号"],
  [/invalid login credentials/i, "邮箱或密码不正确"],
  [/email not confirmed/i, "请先打开确认邮件中的链接完成验证"],
  [/user already registered/i, "该邮箱已注册，请直接登录"],
  [/password should be at least|weak password/i, "密码长度或强度不符合安全要求"],
  [/email rate limit|rate limit|too many requests/i, "请求过于频繁，请稍后再试"],
  [/token has expired|expired.*token|invalid.*token|otp/i, "验证码或确认链接无效，请重新获取"],
  [/email address.*invalid|invalid.*email/i, "请输入有效的邮箱地址"],
  [/signup.*disabled/i, "当前暂未开放账号注册"],
]

export function getAuthErrorMessage(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "")

  return (
    authErrorMessages.find(([pattern]) => pattern.test(rawMessage))?.[1] ??
    "认证服务暂时不可用，请稍后重试"
  )
}

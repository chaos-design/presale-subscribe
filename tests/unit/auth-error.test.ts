import { describe, expect, it } from "vitest"

import { getAuthErrorMessage } from "@/lib/auth-error"

describe("getAuthErrorMessage", () => {
  it.each([
    ["Invalid login credentials", "邮箱或密码不正确"],
    ["Email not confirmed", "请先打开确认邮件中的链接完成验证"],
    ["User already registered", "该邮箱已注册，请直接登录"],
    ["Email rate limit exceeded", "请求过于频繁，请稍后再试"],
    ["Token has expired", "验证码或确认链接无效，请重新获取"],
  ])("maps %s to a user-facing message", (rawMessage, expected) => {
    expect(getAuthErrorMessage(new Error(rawMessage))).toBe(expected)
  })

  it("uses a stable fallback for unknown failures", () => {
    expect(getAuthErrorMessage("network unavailable")).toBe("认证服务暂时不可用，请稍后重试")
  })
})

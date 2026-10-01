export const commonEmailDomains = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "qq.com",
  "foxmail.com",
  "163.com",
  "126.com",
  "yeah.net",
  "sina.com",
  "sina.cn",
  "sohu.com",
  "139.com",
  "189.cn",
  "aliyun.com",
] as const

const commonEmailDomainSet = new Set<string>(commonEmailDomains)

export const commonEmailDomainError = "请使用 Gmail、Outlook、QQ、163、iCloud 等常用邮箱"

export const commonEmailDomainHint = "支持 Gmail、Outlook、QQ、163、iCloud 等常用邮箱"

export function getEmailDomain(email: string) {
  const separatorIndex = email.lastIndexOf("@")

  if (separatorIndex < 1 || separatorIndex === email.length - 1) {
    return ""
  }

  return email
    .slice(separatorIndex + 1)
    .trim()
    .toLowerCase()
}

export function isCommonEmailAddress(email: string) {
  return commonEmailDomainSet.has(getEmailDomain(email))
}

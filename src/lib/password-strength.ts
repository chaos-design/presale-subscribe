export interface PasswordCriterion {
  id: "length" | "mixedCase" | "number" | "symbol"
  label: string
  met: boolean
}

export function getPasswordStrength(password: string) {
  const criteria: PasswordCriterion[] = [
    {
      id: "length",
      label: "至少 8 个字符",
      met: password.length >= 8,
    },
    {
      id: "mixedCase",
      label: "同时包含大小写字母",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "包含数字",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "包含符号",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]
  const score = criteria.filter((criterion) => criterion.met).length
  const label =
    password.length === 0
      ? "未设置"
      : score <= 1
        ? "较弱"
        : score === 2
          ? "一般"
          : score === 3
            ? "较强"
            : "安全"

  return {
    criteria,
    score,
    label,
    isStrong: criteria[0].met && score >= 3,
  }
}

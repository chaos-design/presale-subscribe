import { CheckIcon, ShieldAlertIcon } from "lucide-react"

import { getPasswordStrength } from "@/lib/password-strength"
import { cn } from "@/lib/utils"

export function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password)

  if (!password) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5" aria-live="polite">
      <meter className="sr-only" min={0} max={4} value={strength.score}>
        {strength.score} / 4
      </meter>
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={cn("h-1 rounded-full", strength.score >= level ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
      <div
        className={cn(
          "flex items-start gap-1.5 text-xs leading-relaxed",
          strength.isStrong ? "text-primary" : "text-muted-foreground"
        )}
      >
        {strength.isStrong ? (
          <CheckIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        )}
        <span>
          {strength.isStrong
            ? "已满足安全要求，请勿与其他网站共用。"
            : "至少 8 个字符，并包含大小写字母、数字或符号中的两类。"}
        </span>
      </div>
    </div>
  )
}

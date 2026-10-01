"use client"

import { useEffect, useMemo, useState } from "react"

import type { CampaignCountdownConfig } from "@/types/database"

const countdownUnits = [
  { key: "days", label: "DAYS" },
  { key: "hours", label: "HOURS" },
  { key: "minutes", label: "MIN" },
  { key: "seconds", label: "SEC" },
] as const

function getRemainingSeconds(targetAt: string) {
  const targetTime = Date.parse(targetAt)

  if (Number.isNaN(targetTime)) {
    return 0
  }

  return Math.max(0, Math.floor((targetTime - Date.now()) / 1000))
}

function splitRemainingTime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

export function CampaignCountdown({
  activeEditorTarget,
  countdown,
}: {
  activeEditorTarget?: string
  countdown: CampaignCountdownConfig
}) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const parts = useMemo(
    () => splitRemainingTime(Math.max(0, remainingSeconds ?? 0)),
    [remainingSeconds]
  )
  const isComplete = remainingSeconds !== null && remainingSeconds <= 0

  useEffect(() => {
    function update() {
      setRemainingSeconds(getRemainingSeconds(countdown.targetAt))
    }

    update()
    const intervalId = window.setInterval(update, 1000)

    return () => window.clearInterval(intervalId)
  }, [countdown.targetAt])

  return (
    <section
      className="campaign-page-countdown"
      data-campaign-reveal
      data-editor-target="countdown"
      data-editor-active={activeEditorTarget === "countdown" ? true : undefined}
      aria-label={countdown.label}
    >
      <div className="campaign-page-countdown-copy">
        <span>COUNTDOWN / LIVE</span>
        <h2>{isComplete ? countdown.completeLabel : countdown.label}</h2>
      </div>
      <dl className="campaign-page-countdown-grid" aria-live="polite">
        {countdownUnits.map((unit, index) => (
          <div key={unit.key} data-unit-index={String(index + 1).padStart(2, "0")}>
            <dt>{unit.label}</dt>
            <dd>{remainingSeconds === null ? "--" : String(parts[unit.key]).padStart(2, "0")}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

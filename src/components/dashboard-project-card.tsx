"use client"

import { useRouter } from "next/navigation"
import type { MouseEvent, ReactNode } from "react"

interface DashboardProjectCardProps {
  children: ReactNode
  draftDirty: boolean
  href: string
  published: boolean
}

function isNestedControl(target: EventTarget | null, card: HTMLDivElement) {
  return target instanceof Element && target !== card && Boolean(target.closest("a, button, input"))
}

export function DashboardProjectCard({
  children,
  draftDirty,
  href,
  published,
}: DashboardProjectCardProps) {
  const router = useRouter()

  function openProject() {
    router.push(href)
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!isNestedControl(event.target, event.currentTarget)) {
      openProject()
    }
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/noStaticElementInteractions: this visual card intentionally uses pointer navigation while nested links remain semantic
    <div
      className="dashboard-project-card"
      data-published={published}
      data-draft-dirty={draftDirty}
      onClick={handleClick}
      onMouseEnter={() => router.prefetch(href)}
    >
      {children}
    </div>
  )
}

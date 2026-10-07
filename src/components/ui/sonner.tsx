"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--width": "min(26rem, calc(100vw - 1.5rem))",
          "--normal-bg": "oklch(0.44 0.16 255)",
          "--normal-text": "oklch(0.98 0.01 255)",
          "--normal-border": "oklch(0.67 0.14 250)",
          "--success-bg": "oklch(0.44 0.14 155)",
          "--success-text": "oklch(0.98 0.014 155)",
          "--success-border": "oklch(0.68 0.13 155)",
          "--error-bg": "oklch(0.5 0.19 28)",
          "--error-text": "oklch(0.98 0.012 28)",
          "--error-border": "oklch(0.68 0.17 28)",
          "--info-bg": "oklch(0.44 0.16 255)",
          "--info-text": "oklch(0.98 0.01 255)",
          "--info-border": "oklch(0.67 0.14 250)",
          "--warning-bg": "oklch(0.78 0.15 82)",
          "--warning-text": "oklch(0.18 0.038 70)",
          "--warning-border": "oklch(0.67 0.13 75)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success: "cn-toast-success",
          error: "cn-toast-error",
          info: "cn-toast-info",
          warning: "cn-toast-warning",
          loading: "cn-toast-info",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

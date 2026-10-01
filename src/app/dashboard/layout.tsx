import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/dashboard-nav"
import { getCurrentUser, getDemoUser, isDemoMode } from "@/lib/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authenticatedUser = await getCurrentUser()

  if (!authenticatedUser && !isDemoMode()) {
    redirect("/login")
  }

  const user = authenticatedUser ?? getDemoUser()

  return <DashboardShell user={user}>{children}</DashboardShell>
}

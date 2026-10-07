"use client"

import {
  ChartNoAxesColumnIncreasingIcon,
  FolderKanbanIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SearchIcon,
  UserRoundIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { signOutAction } from "@/app/dashboard/actions"
import { BrandMark } from "@/components/brand-mark"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import type { AppUser } from "@/lib/auth"
import { templateOptions } from "@/lib/campaign-presets"

const navigation = [
  { href: "/dashboard", label: "总览", icon: LayoutDashboardIcon, exact: true },
  {
    href: "/dashboard/projects",
    label: "项目",
    icon: FolderKanbanIcon,
    activePrefixes: ["/dashboard/projects", "/dashboard/new", "/dashboard/campaigns"],
  },
  {
    href: "/dashboard/templates",
    label: "模板",
    icon: LayoutTemplateIcon,
  },
  {
    href: "/dashboard/analytics",
    label: "数据分析",
    icon: ChartNoAxesColumnIncreasingIcon,
  },
] as const

const quickCommandItems = [
  { href: "/dashboard/new", label: "创建项目", icon: PlusIcon },
  { href: "/dashboard/account", label: "账号设置", icon: UserRoundIcon },
] as const

type NavigationItem = (typeof navigation)[number]

function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if ("exact" in item && item.exact) {
    return pathname === item.href
  }

  if ("activePrefixes" in item) {
    return item.activePrefixes.some((prefix) => pathname.startsWith(prefix))
  }

  return pathname.startsWith(item.href)
}

function DashboardSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="dashboard-search-trigger"
        aria-label="搜索工作区"
        onClick={() => setOpen(true)}
      >
        <SearchIcon data-icon="inline-start" aria-hidden="true" />
        <span>搜索工作区</span>
        <kbd>⌘ K</kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="搜索工作区"
        description="搜索页面或执行常用操作"
        className="dashboard-command-dialog"
      >
        <Command>
          <CommandInput placeholder="搜索页面或操作..." autoFocus />
          <CommandList>
            <CommandEmpty>没有匹配结果</CommandEmpty>
            <CommandGroup heading="页面">
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.href} 工作区 页面`}
                    onSelect={() => navigate(item.href)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="快速操作">
              {quickCommandItems.map((item) => {
                const Icon = item.icon

                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.href} 快捷 操作`}
                    onSelect={() => navigate(item.href)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.href === "/dashboard/new" ? <CommandShortcut>N</CommandShortcut> : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={`模板快捷创建 · ${templateOptions.length} 套`}>
              {templateOptions.map((template) => (
                <CommandItem
                  key={template.value}
                  value={`${template.label} ${template.description} ${template.code} ${template.category} 模板 创建`}
                  onSelect={() => navigate(`/dashboard/new?template=${template.value}`)}
                >
                  <LayoutTemplateIcon aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{template.label}</span>
                    <small className="block truncate text-[10px] text-muted-foreground">
                      {template.description}
                    </small>
                  </span>
                  <CommandShortcut>{template.code}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

function UserMenu({ user }: { user: AppUser }) {
  const initials = user.name.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="dashboard-sidebar-user"
            tooltip="账号菜单"
            aria-label="打开账号菜单"
          />
        }
      >
        <Avatar size="sm">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-xs font-medium">{user.name}</span>
          <span className="block truncate text-[9px] text-muted-foreground">{user.email}</span>
        </span>
        <MoreHorizontalIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{user.isDemo ? "演示工作区" : "当前账号"}</DropdownMenuLabel>
          <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard/account" />}>
            <UserRoundIcon aria-hidden="true" />
            账号设置
          </DropdownMenuItem>
          <form action={signOutAction}>
            <DropdownMenuItem
              nativeButton
              render={<button type="submit" className="w-full" />}
              variant="destructive"
            >
              <LogOutIcon aria-hidden="true" />
              退出登录
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DashboardSidebarToggle() {
  const { state, toggleSidebar } = useSidebar()
  const expanded = state === "expanded"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      data-slot="sidebar-trigger"
      data-sidebar="trigger"
      className="dashboard-sidebar-header-trigger hidden md:inline-flex"
      aria-label="收起或展开侧栏"
      title={expanded ? "收起侧栏" : "展开侧栏"}
      aria-expanded={expanded}
      onClick={toggleSidebar}
    >
      {expanded ? (
        <PanelLeftCloseIcon aria-hidden="true" />
      ) : (
        <PanelLeftOpenIcon aria-hidden="true" />
      )}
      <span className="sr-only">{expanded ? "收起侧栏" : "展开侧栏"}</span>
    </Button>
  )
}

function DashboardSidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="dashboard-sidebar">
      <SidebarHeader className="dashboard-sidebar-header">
        <div className="dashboard-sidebar-brand">
          <BrandMark />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="dashboard-sidebar-menu">
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isNavigationItemActive(pathname, item)}
                      tooltip={item.label}
                      className="dashboard-sidebar-menu-button group-data-[collapsible=icon]:size-[2.75rem]! group-data-[collapsible=icon]:p-0!"
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

/**
 * 编辑器是一块全屏画布，不需要工作台外壳。
 *
 * 这里用路由判定而不是 CSS `:has(.campaign-studio)` 去嗅探子节点：App Router 流式渲染时
 * 页面内容会先挂在 body 下的临时容器里，水合后才搬进 .dashboard-shell，`:has()` 要等搬完
 * 才命中，侧栏于是先占位再消失，实测给编辑器带来 CLS 0.153（超出 0.1 预算）。
 * usePathname 在服务端渲染时就可用，首屏即是终态布局。
 */
const studioRoutePattern = /^\/dashboard\/campaigns\/[^/]+\/edit\/?$/

export function DashboardShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const isStudioRoute = studioRoutePattern.test(pathname)

  return (
    <SidebarProvider
      className="dashboard-shell bg-background"
      data-studio-route={isStudioRoute ? "true" : undefined}
      style={
        {
          "--sidebar-width": "13.75rem",
          "--sidebar-width-icon": "4.25rem",
        } as React.CSSProperties
      }
    >
      <DashboardSidebar user={user} />
      <SidebarInset className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <div className="dashboard-header-leading">
              <SidebarTrigger className="md:hidden" aria-label="打开导航" />
              <DashboardSidebarToggle />
              <span className="dashboard-header-separator hidden md:block" aria-hidden="true" />
              <DashboardSearch />
            </div>
          </div>
        </header>
        <div className="dashboard-content">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

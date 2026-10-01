"use client"

import {
  CopyIcon,
  ExternalLinkIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { deleteCampaignAction, togglePublicationAction } from "@/app/dashboard/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CampaignStatus } from "@/types/database"

interface CampaignActionsMenuProps {
  campaignId: string
  campaignName: string
  slug: string
  status: CampaignStatus
}

export function CampaignActionsMenu({
  campaignId,
  campaignName,
  slug,
  status,
}: CampaignActionsMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isPublished = status === "published"

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`)
      toast.success("分享链接已复制")
    } catch {
      toast.error("无法复制链接，请检查浏览器权限")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="项目操作" title="项目操作" />}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href={`/dashboard/campaigns/${campaignId}/edit`} />}>
              <PencilIcon aria-hidden="true" />
              编辑配置
            </DropdownMenuItem>
            {isPublished ? (
              <DropdownMenuItem
                render={<Link href={`/dashboard/campaigns/${campaignId}/subscribers`} />}
              >
                <UsersIcon aria-hidden="true" />
                预约名单
              </DropdownMenuItem>
            ) : null}
            {isPublished ? (
              <DropdownMenuItem render={<Link href={`/p/${slug}`} target="_blank" />}>
                <ExternalLinkIcon aria-hidden="true" />
                打开分享页
              </DropdownMenuItem>
            ) : null}
            {isPublished ? (
              <DropdownMenuItem onClick={copyShareLink}>
                <CopyIcon aria-hidden="true" />
                复制链接
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <form action={togglePublicationAction}>
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="nextStatus" value={isPublished ? "draft" : "published"} />
              <DropdownMenuItem nativeButton render={<button type="submit" className="w-full" />}>
                {isPublished ? <EyeOffIcon aria-hidden="true" /> : <SendIcon aria-hidden="true" />}
                {isPublished ? "撤回上线" : "发布草稿"}
              </DropdownMenuItem>
            </form>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon aria-hidden="true" />
              删除项目
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2Icon aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>删除“{campaignName}”？</AlertDialogTitle>
            <AlertDialogDescription>
              项目配置、媒体文件、访问数据和全部订阅邮箱都会永久删除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <form action={deleteCampaignAction}>
              <input type="hidden" name="campaignId" value={campaignId} />
              <AlertDialogAction type="submit" variant="destructive">
                确认删除
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Server Action 的返回契约。
 *
 * 单独成文件是为了让客户端组件能直接取 `initialActionState`，而不必连带
 * `@/lib/validation` 里的 zod（整包约 285 KB 未压缩）进入浏览器包。
 * 这里不得引入任何依赖，保持为纯类型与常量。
 */
export interface ActionState {
  status: "idle" | "success" | "error"
  message: string
  version?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
}

# 参与 Ahead 开发

[English](./CONTRIBUTING.md)

Ahead 是一个基于 Next.js 16、React 19、Supabase、Tailwind CSS 4 与 Biome 的开源功能
预告与预约订阅系统。本文说明本地环境、CI 强制的分支策略、每个变更必须通过的质量门禁，
以及数据库变更的发布方式。

参与贡献即表示同意你的代码以 [Apache-2.0](./LICENSE) 授权。

## 1. 环境准备

- Node.js 20.9 或更高版本（`package.json` 通过 `engines` 声明）。
- pnpm 11.21.0，使用 `packageManager` 中锁定的版本；不要提交 `package-lock.json` 或
  `yarn.lock`。
- 可选：一个 Supabase 项目用于真实数据。没有它时应用运行在只读演示模式，足以完成界面
  开发并运行 Playwright。

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

## 2. 启动与构建

```bash
pnpm dev            # http://localhost:4433，Turbopack
pnpm build          # 生产构建
pnpm start          # 以 4433 端口运行生产构建
pnpm test:e2e       # 先构建，再用 next start 在 3100 端口跑 Playwright 演示模式
```

`dev`、`build`、`start` 都支持 `NEXT_DIST_DIR`，默认写入 `.next`。Playwright 会构建应用并
用 `next start` 提供服务，因此 E2E 覆盖的是生产产物；运行 E2E 会覆盖本地 `.next` 构建。

## 3. 分支与提交策略

- 使用短生命周期分支，例如 `feat/countdown-presets`。
- 向 `main` 提交 Pull Request；分支保护禁止直接推送 `main`。
- 每个 Pull Request 必须通过 `quality` 与 `e2e` 检查，需要一次他人审批，不得由作者本人
  审批，必须解决所有对话，且保持线性历史；禁止强制推送和删除分支。
- 每个仓库只需配置一次保护规则：

```bash
GH_TOKEN=<具有 administration write 权限的令牌> \
  ./scripts/configure-branch-protection.sh owner/repository main
```

- 合并到 `main` 会自动发布 Vercel Production。涉及路由、认证或分析行为的改动，先手动
  发布 Preview 验证再合并。

## 4. 质量门禁

执行与 CI 相同的命令：

```bash
pnpm lint        # Biome；本项目不使用 ESLint
pnpm typecheck   # tsc --noEmit，严格模式
pnpm docs:check  # 校验全部 Markdown 相对链接与标题锚点
pnpm test        # Vitest 单元测试
pnpm build       # 生产构建
pnpm check       # lint + typecheck + docs:check + test
pnpm test:e2e    # Playwright，界面主流程改动必跑
```

`pnpm docs:check` 执行 `scripts/check-doc-links.mjs`，遍历所有 Markdown 文件，只要相对链接
或标题锚点失效就失败。重命名文档或调整标题结构后必须运行。

写代码前需要知道的项目约定：

- TypeScript 严格模式；不允许用 `any` 绕过类型检查。
- 前端文件名小写加连字符，函数小驼峰，组件与类型大驼峰。格式由 Biome 决定（2 空格、
  双引号、必要时分号、尾随逗号、行宽 100）。
- 不读取、打印或提交 `.env` 真实值；只维护 `.env.example`。
- 不在浏览器代码、文档、测试或日志中放入服务端密钥；应用必须只在 Publishable Key 下
  可用。
- 所有管理端写操作留在 Server Action 或服务端路由，并在服务端重新验证调用者身份。

### 保持 Playwright 稳定

E2E 跑在真实生产构建上，编译耗时不再是变量；但 GSAP 入场动画仍会在滚动触发前把内容置为
`visibility: hidden`，编辑器聚焦高亮也是命令式写入并在很短时间内清除。三条约定让套件稳定：

- 除非用例本身验证动效，否则开头执行 `await page.emulateMedia({ reducedMotion: "reduce" })`；
  关闭动效后会跳过滚动触发的显现动画与平滑滚动。
- 瞬时状态必须在触发它的操作之后立刻断言。编辑器聚焦高亮约一秒后消失，应先于其它断言检查。
- 断言 `src/lib` 中的配置值（例如 `productConfig`），不要硬编码，避免改配置就要改全部用例。

`playwright.config.ts` 调高测试与断言超时，是因为逐模板批量校验的用例会做几十次渲染。

## 5. 数据库变更

`supabase/platform.sql` 是唯一权威、可整份重复执行的全量脚本；`supabase/update.sql`
只保留尚未执行的增量。

1. 先修改 `platform.sql`，保持幂等并写清注释。
2. 如果该变更需要在下次全量执行前上线，同步写入 `update.sql`；不保留已执行的历史增量。
3. 同步更新 `src/types/database.ts`、校验层与单元测试，涉及授权与策略时必须更新
   `tests/unit/database-security.test.ts`。
4. 同步更新架构文档与部署文档。

公开 SQL 必须持续满足：

- 公开 RPC 使用 `security definer` 与 `set search_path = ''`，从 `public` 回收权限，并按
  精确签名授予最小角色集合。
- `anon` 角色不得获得 `users`、`subscription_campaigns`、`subscribers`、
  `campaign_page_views` 的 `SELECT` 或 `INSERT` 权限。
- 预约在 `(campaign_id, email)` 上保持幂等；问卷答案必须在 Server Action 与 RPC 中都按
  已发布题目校验。

当前契约记录在[架构说明](./docs/architecture.md#4-rpc-契约)中，变更后请同步更新。

## 6. Pull Request 检查清单

- 本地 `pnpm check` 与 `pnpm build` 通过。
- 认证、编辑器、公开页或分析相关改动已更新或确认 Playwright。
- 新行为有单元测试覆盖；业务逻辑尽量保留为可测的纯函数。
- 视觉改动附截图，包含手机视口。
- 用户可见与部署可见文档已中英双语同步。
- PR 描述写明改了什么、如何验证，以及涉及数据库迁移时的回滚方式。

## 7. 安全问题

安全问题不要提交公开 Issue，请按 [SECURITY.md](./SECURITY.zh-CN.md) 处理。
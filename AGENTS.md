# AGENTS.md

本文面向在 Ahead 仓库内工作的 AI Coding Agent，适用于仓库根目录及全部子目录。

## 项目概览

Ahead 是一个功能预告与预约订阅系统。团队可以创建订阅活动、编辑草稿、发布不可变线上快照、撤回页面，并管理通过公开链接收集的订阅邮箱。

核心目录：

- `src/app/`：Next.js App Router 页面、布局、Server Actions 和 Route Handlers。
- `src/components/`：活动编辑器、公开页面、订阅管理和 UI 组件。
- `src/lib/`：认证、Supabase 客户端、业务查询、预设和校验。
- `src/types/`：数据库与业务类型。
- `supabase/platform.sql`：可整份重复执行的数据库与 Storage 初始化 SQL。
- `supabase/update.sql`：当前尚待执行的增量 SQL，内容必须已合并进全量 SQL；不保留已执行的历史增量脚本。
- `tests/e2e/`：Playwright 主流程测试。

## 必守规则

- 使用 pnpm，不提交 npm 或 Yarn 锁文件。
- 不使用 ESLint，静态检查统一使用 Biome。
- 不读取、打印或提交 `.env` 中的真实值；变量说明只参考 `.env.example`。
- 不在浏览器代码、文档、测试或日志中加入服务端密钥。
- 不手工修改 `.next/`、`coverage/`、`playwright-report/`、`test-results/` 或 `node_modules/`。
- 所有管理操作必须在服务端重新验证用户身份和数据归属。
- 公开页面只能读取已发布快照；草稿更新不能直接影响线上内容。
- 匿名订阅只能通过受限 RPC 写入，不直接开放业务表权限。

## 代码风格

- TypeScript 使用严格模式，不引入 `any` 规避类型检查。
- 前端文件名全小写并使用连字符。
- 函数名使用小驼峰；React 组件和类型使用 PascalCase。
- 2 空格缩进、双引号、按需分号和尾随逗号，以 Biome 配置为准。
- 优先复用现有组件、Schema、类型和 Supabase helper。
- 复杂业务逻辑优先提取为纯函数并补充测试。
- 只在代码不易自解释时添加简短注释。

## 数据与安全

- 最小环境变量集只有 `NEXT_PUBLIC_SUPABASE_URL` 和
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
- Supabase Auth 负责邮箱密码、邮箱确认和邮箱验证码登录。
- RLS 按活动所有者隔离 `subscription_campaigns` 与 `subscribers`。
- `get_published_campaign` 和 `subscribe_to_campaign` 是公开访问的唯一业务入口。
- 同一活动下相同邮箱必须保持幂等。
- 发布时复制 `draft_config` 到 `published_config`，撤回只改变公开状态。

## 常用命令

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm test
pnpm test:e2e
pnpm build
```

提交结果前至少运行 `pnpm check` 和 `pnpm build`。涉及关键用户流程或响应式布局时，补充或运行 Playwright 测试。
修改文件名、标题或文档结构后运行 `pnpm docs:check`，它会校验全部 Markdown 链接与锚点。

## 文档

- README、开发和部署文档维护中英双语。
- AI 协作说明只保留本中文文件。
- 改动数据模型、RPC 契约或请求流前先读 `docs/architecture.md`，并保持该文档同步。
- 提交规范与质量门禁见 `CONTRIBUTING.zh-CN.md`，漏洞报告流程见 `SECURITY.zh-CN.md`。
- 新增环境变量、数据库对象或公开路由时，同步更新相关文档。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

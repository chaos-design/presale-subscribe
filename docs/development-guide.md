# REPS 开发手册

[English](./development-guide.en.md)

数据模型、RPC 契约与请求流见[架构说明](./architecture.md)；贡献流程与门禁见
[贡献指南](../CONTRIBUTING.zh-CN.md)。

## 本地环境

- Node.js 22.13 或更高版本（`package.json` 的 `engines` 会在安装时校验；该下限来自 pnpm 11.21）
- pnpm 11.21.0（`packageManager` 锁定版本）
- 可选的 Supabase 开发项目

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`pnpm dev` 在 4433 端口启动 Turbopack 开发服务器，`pnpm start` 在同一端口提供生产构建：

```bash
pnpm build
pnpm start
```

`dev`、`build`、`start` 都支持 `NEXT_DIST_DIR`，默认写入 `.next`。`pnpm test:e2e` 会先执行
一次 `pnpm build`，再用 `next start` 提供服务，因此测试的是真实生产产物；代价是运行 E2E
会覆盖本地 `.next` 构建，需要时重新 `pnpm build`。

环境变量只包含：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

不配置这两个值时，应用进入只读演示模式，可浏览工作台、编辑器、公开页面和示例订阅流程。

## 本地 Supabase

本地数据库需要 Docker 兼容运行时与 Supabase CLI。仓库中的
`supabase/config.toml` 会在重置数据库时自动整份执行 `supabase/platform.sql`：

```bash
supabase start
supabase db reset
```

默认数据库地址是 `postgresql://postgres:postgres@127.0.0.1:54322/postgres`。结束开发时
使用 `supabase stop`；不要把 `supabase status` 输出的本地密钥提交到仓库。

`platform.sql` 是唯一权威全量 SQL。`update.sql` 只保留当前尚待执行的
增量升级，不加入 `db reset`，并且每项变更必须同步合并回全量 SQL。增量执行完成后，
下次数据库变更直接覆盖该文件，不保留已执行的历史增量脚本。

两个脚本都可重复执行，且 `update.sql` 在已经执行过当前 `platform.sql` 的数据库上不会产生
差异。修改任一脚本后，除了在本地 Supabase 上执行，还应确认：全量脚本连续执行两次不报错，
增量脚本在已同步的数据库上执行后函数签名、授权、策略与索引保持不变。

## 数据库自动化校验

`pnpm test:db` 在进程内运行 PGlite（WebAssembly 版 PostgreSQL），只桩掉 Supabase 提供的
`auth`、`storage` 架构与 `anon`、`authenticated` 角色，其余全部执行真实 SQL。它校验：

- `platform.sql` 可连续执行两次，`update.sql` 在已同步数据库上不产生任何差异。
- 四张业务表启用 RLS，`anon` 无任何直接授权，所有者只拿到工作台所需的权限。
- 每个 RPC 的 `security definer`/`invoker`、执行角色与固定 `search_path`。
- 媒体桶配置与四条 Storage 策略，且不存在匿名列举策略。
- 预约幂等、问卷校验、关闭预约区后的写入拦截、访问散列与所有者隔离。

因此 SQL 变更无需 Docker 或本地 Supabase 项目即可验证，回归会在 CI 暴露。

## 工程结构

| 路径 | 说明 |
| --- | --- |
| `src/app/` | 页面、布局、Server Actions 与 Route Handlers |
| `src/components/` | 业务组件与 shadcn/ui 基础组件 |
| `src/lib/` | 认证、查询、校验、预设和 Supabase helper |
| `src/types/database.ts` | 数据库与业务类型 |
| `public/brand/` | REPS 品牌图形：印章与 slogan 徽章 |
| `supabase/platform.sql` | 可整份重复执行的数据库与 Storage 初始化脚本 |
| `supabase/update.sql` | 当前尚待执行的预约入口保护与媒体 Storage 策略增量更新 |
| `tests/unit/` | Vitest 单元测试与 SQL 文本断言 |
| `tests/integration/` | PGlite 数据库脚本、授权与行为集成测试 |
| `tests/e2e/` | Playwright 主流程测试 |

## 品牌图形

`public/brand/` 下的 SVG 是 REPS 的品牌图形来源，字标全部由描边路径拼成，不依赖字体文件，
因此可以原样内联、被 CSS 着色，也不会因为访客缺少某个字体而降级：

| 文件 | 用途 |
| --- | --- |
| `reps-mark.svg` | 印章图形，导航、工作台与 favicon 使用；色值固定，不随 `currentColor` 变化 |
| `reps-slogan.svg` | 带 slogan 的品牌徽章，README 顶部使用 |

`src/app/icon.svg` 与 `src/app/apple-icon.png` 是同一枚印章的应用图标副本，需要与
`reps-mark.svg` 同步；分享图由 `src/app/opengraph-image.tsx` 在构建时渲染。改动任何一处
图形后运行 `pnpm check`，并确认导航和图标都没有变形。

## 产品与源码链接配置

`src/lib/product-config.ts` 集中维护 REPS 产品自身的名称、字标、首页地址，以及显示在
公开项目页底部的产品署名和 GitHub 仓库地址。它用于推广 REPS 项目本身，不属于用户在
模板中配置的项目内容，也不会进入项目的草稿或发布快照：

```ts
export const productConfig = {
  name: "REPS",
  fullName: "Release, Email-capture, Preview & Subscription",
  wordmark: "REPS",
  stages: ["Release", "Email-capture", "Preview", "Subscription"],
  slogan: "Every release, a way in.",
  // 供分享图与站点元信息使用的英文描述；中文描述保留在 tagline。
  description: "Prescribe the release. Capture the demand.",
  tagline: "把功能预告做成一条可以追踪的发布链路",
  homePath: "/",
  productCredit: {
    label: "MADE WITH REPS",
    description: "开源功能预告与预约订阅系统",
    year: "2026",
    githubUrl: "https://github.com/chaos-design/presale-subscribe",
  },
} as const
```

`name` 与 `fullName` 展开缩写，`stages` 是四个环节的英文名，`slogan` 是英文 slogan，
`description` 是英文一句话描述，`tagline` 是中文描述。分享图 `src/app/opengraph-image.tsx`
只使用英文字段，因为 `ImageResponse` 内置的 Geist 字体不含中文字形。

部署前应确认 `githubUrl` 指向该部署对应的公开源码仓库。公开预约页会把它渲染成仅含
GitHub 图标的外部链接，并在新标签页打开；编辑器预览只显示图标，不触发跳转。修改
配置后运行 `pnpm check` 和 `pnpm build`，并确认桌面端与手机端页脚没有溢出。

## 主要路由

| 路由 | 用途 |
| --- | --- |
| `/` | 产品首页与模板展示 |
| `/login` | 密码、验证码登录和注册 |
| `/forgot-password` / `/reset-password` | 密码恢复流程 |
| `/terms` / `/privacy` | 服务条款与隐私政策 |
| `/dashboard` | 模板库、项目库与账号设置 |
| `/dashboard/analytics` | PV/UV、来源、设备、转化与问卷回答分析 |
| `/p/[slug]` | 只读取已发布快照的公开预约页 |

## 业务边界

- `subscription_campaigns.draft_config` 是可编辑草稿。
- 发布时草稿复制到 `published_config`，公开页只读取已发布快照。
- 功能介绍、长文案、图片与视频地址、模板、细粒度动效和问卷定义都保存在同一份配置快照中。
- 图片与视频上传到公开只读的 `campaign-media` bucket，写入路径按用户和活动隔离。
  图片由客户端限制为 8 MB，视频限制为 100 MB。
- 撤回活动不会删除草稿或订阅者，只停止公开访问。
- 公开订阅通过 `subscribe_to_campaign` RPC 写入邮箱与 `answers`，按活动和邮箱幂等；
  随机访客与会话标识仅以 SHA-256 散列关联预约和访问行为。
- 公开预约仅接受 Gmail、Outlook、QQ、163、iCloud 等常用邮箱域名；前端、Server Action
  与 RPC 使用同一白名单规则。
- 问卷答案在 Server Action 和 RPC 中按已发布题目、必填规则与选项白名单重复校验。
- 公开页通过 `track_campaign_page_view` 与 `track_campaign_page_engagement` RPC 上报访问、
  有效停留、最大滚动深度和交互次数。数据库不保存 IP、原始 User-Agent 或精确位置。
- 国家/地区/城市优先使用 Vercel 或兼容平台注入的粗粒度请求头；字段缺失时，服务端以
  短超时 IP 地理查询补全，只保存国家、地区和城市，不保存原始 IP。语言与时区来自浏览器。
- 管理端通过 `get_campaign_analytics` 和 `get_campaign_behavior_analytics` RPC 按指定
  项目聚合访问、转化、行为、地域和申请问卷数据，并通过受限 RPC 读取预约访问画像。
- 管理端数据由 RLS 按当前登录用户隔离。

## 质量检查

```bash
pnpm lint
pnpm typecheck
pnpm docs:check
pnpm test
pnpm test:e2e
pnpm build
```

`pnpm check` 会依次运行 Biome、类型检查、文档链接校验和 `tests/unit` 与 `tests/integration` 下的测试。
`pnpm docs:check` 校验全部 Markdown 相对链接与标题锚点。Playwright 从 `tests/e2e` 运行，
先执行一次 `pnpm build` 再用 `next start` 提供服务，并显式清空 Supabase 环境变量，以演示
模式验证关键页面，不会连接本地或生产数据库。

## 开发约定

- 前端文件名使用小写和连字符，函数名使用小驼峰。
- 业务写操作留在 Server Actions 或服务端路由。
- 客户端 Supabase 用于认证和受 RLS 约束的活动媒体上传，不直接读写业务表。
- 新增配置字段时同步更新类型、Zod Schema、默认值、数据库 JSON 和编辑器。
- 数据库变更先合并进 `platform.sql`；需要增量发布时覆盖 `update.sql`，
  并同步更新类型、README 与部署文档，不保留已执行的历史增量脚本。

更完整的扩展检查清单见[架构说明](./architecture.md#8-扩展检查清单)；漏洞报告方式见
[安全策略](../SECURITY.zh-CN.md)。

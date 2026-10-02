# Ahead 架构说明

[English](./architecture.en.md)

本文面向开发与运维，说明 Ahead 的分层边界、数据模型、RPC 契约和关键请求流。
产品操作请看[使用手册](./user-guide.md)，本地环境与命令请看[开发手册](./development-guide.md)，
生产发布请看[部署手册](./deployment-guide.md)。

## 1. 分层与信任边界

```text
浏览器（公开页面 / 工作台）
  │  Supabase Publishable Key（公开，可被浏览器读取）
  ├─ Supabase Auth：注册、登录、验证码、密码恢复、会话 Cookie
  └─ Supabase Storage：仅上传自己活动目录下的图片与视频
  │  受 RLS / Storage 策略约束
  ▼
Next.js（Vercel）
  ├─ src/proxy.ts：刷新会话，未登录访问 /dashboard 时重定向
  ├─ Server Components：服务端读取，按用户隔离
  ├─ Server Actions：所有管理端写操作，再次校验身份与归属
  └─ Route Handlers：/api/analytics/engagement 参与度上报
  │  使用同一个 Publishable Key，服务端不做特权提权
  ▼
Supabase Postgres（唯一权威数据层）
  ├─ 4 张业务表 + RLS：只允许所有者读取自己的数据
  └─ security definer RPC：公开读取、匿名预约、匿名上报的唯一入口
```

三条必须长期成立的边界：

1. **应用不需要 `service_role` 密钥。** 服务端与浏览器使用同一个 Publishable Key，
   权限完全由 RLS 与 RPC 决定。
2. **公开写入只经过受限 RPC。** 匿名角色对四张业务表没有 `SELECT`/`INSERT` 权限，
   公开读取、预约和访问上报都必须调用已 `revoke`/`grant` 到精确签名的 RPC。
3. **公开页只读已发布快照。** 草稿保存在 `draft_config`，不会出现在任何公开路径上。

## 2. 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/app/` | 路由、布局、Server Actions、Route Handlers |
| `src/components/` | 业务组件；`src/components/ui/` 是 shadcn/ui 基础组件 |
| `src/lib/` | 业务查询、校验、认证、Supabase helper 与纯函数 |
| `src/lib/validation.ts` | 活动配置的唯一校验来源（Zod） |
| `src/lib/campaigns.ts` | 活动读写、发布/撤回、公开快照读取、演示数据 |
| `src/lib/analytics.ts` | 分析聚合与前端图表数据整形 |
| `src/types/database.ts` | 数据库行类型与配置快照类型 |
| `supabase/platform.sql` | 唯一权威全量 SQL，可整份重复执行 |
| `supabase/update.sql` | 当前尚待执行的增量 SQL，内容必须已合并进全量 SQL |
| `tests/unit/`、`tests/integration/`、`tests/e2e/` | Vitest 单元测试、PGlite 数据库集成测试与 Playwright 主流程测试 |

## 3. 数据模型

### 3.1 业务表

| 表 | 关键列 | 说明 |
| --- | --- | --- |
| `users` | `id`（引用 `auth.users`）、`full_name`、`avatar_url` | 用户公开资料；注册时由触发器 `handle_new_user()` 同步创建 |
| `subscription_campaigns` | `user_id`、`slug`、`status`、`draft_config`、`published_config`、`published_at` | 活动主表。`slug` 全局唯一且稳定，`status` 为 `draft` 或 `published` |
| `subscribers` | `campaign_id`、`email`（`citext`）、`answers`、`visitor_hash`、`session_hash` | 预约名单；`unique (campaign_id, email)` 保证幂等 |
| `campaign_page_views` | `campaign_id`、`view_hash`、`visitor_hash`、`session_hash`、来源/设备/语言/时区、粗粒度地域、`duration_seconds`、`max_scroll_depth`、`interaction_count` | 公开页访问事件；`unique (campaign_id, view_hash)` 让重复上报幂等 |

哈希列长度固定为 64 个十六进制字符：浏览器生成的访客与会话标识只在服务端
`encode(digest(...))` 成 SHA-256 后入库，数据库不保存原始标识、IP 或原始 User-Agent。

### 3.2 存储桶

- bucket：`campaign-media`，`public = true`，单文件上限 100 MB。
- 允许类型：`image/jpeg`、`image/png`、`image/webp`、`image/avif`、`video/mp4`、
  `video/webm`、`video/ogg`、`video/quicktime`。
- 对象路径固定为 `{userId}/{campaignId}/{fileName}`。写入、更新、删除都要求路径首段
  等于当前 `auth.uid()`，并且 `public.can_manage_campaign_media()` 校验活动归属。
- 公开桶允许通过已知 URL 直接读取，因此**不要上传任何非公开素材**；匿名用户没有
  `storage.objects` 的列举权限，无法枚举目录。

### 3.3 配置快照结构

`draft_config` 与 `published_config` 是同一份 `CampaignConfig` 结构，校验入口是
`src/lib/validation.ts` 的 `campaignConfigSchema`：

| 顶层字段 | 内容 |
| --- | --- |
| `name`/`title`/`slogan`/`description`/`featureTitle`/`featureDescription`/`eyebrow` | 品牌与文案 |
| `emailLabel`/`buttonLabel`/`successMessage` | 预约区交互文案 |
| `coverImage`/`coverImagePosition`/`previewVideo` | 图片、焦点与视频（自动播放必须静音） |
| `themeColor`/`template`/`motion`/`motionSettings` | 配色、16 种模板之一、动效类型与强度 |
| `header`/`marquee`/`countdown` | 顶栏、滚动标语与倒计时 |
| `highlights`（`pageContent`）与 `sectionVisibility`/`sectionOrder` | 长文案内容和页面区域显隐与排序 |
| `questionnaire` | 问卷开关、标题说明与题目数组（简答/单选/多选） |
| `intent` | 仅存在于请求侧：`draft` 表示只存草稿，`publish` 表示同时发布 |

发布动作把 `draft_config` 原样复制到 `published_config`，因此公开页读到的永远是
发布那一刻的不可变内容。

## 4. RPC 契约

公开入口只有前四个；其余为管理端入口或内部函数。

| RPC | 可执行角色 | 用途与关键不变量 |
| --- | --- | --- |
| `get_published_campaign(text)` | `anon`, `authenticated` | 只返回 `status = 'published'` 且 `published_config` 非空的活动；只暴露公开渲染所需字段 |
| `subscribe_to_campaign(text, text, jsonb, text, text)` | `anon`, `authenticated` | 幂等预约：邮箱格式与域名白名单、答案体积、题目白名单、必答规则、选项白名单在函数内重复校验；`on conflict do nothing` 且不返回邮箱是否已存在；发布快照关闭预约区时抛错 |
| `track_campaign_page_view(...)` | `anon`, `authenticated` | 匿名 PV 上报；只接受已发布 slug，标识按 SHA-256 存储，`(campaign_id, view_hash)` 幂等 |
| `track_campaign_page_engagement(text, text, integer, integer, integer)` | `anon`, `authenticated` | 用 `view_id` 定位同一次访问，累计停留、滚动深度与交互次数 |
| `get_campaigns_with_counts()` | `authenticated` | 当前用户活动列表与预约计数 |
| `get_campaign_analytics(uuid, integer)` | `authenticated` | 指定已发布活动的 PV/UV/会话/转化/来源/设备/邮箱域名/问卷分布；天数收敛到 7–365 |
| `get_campaign_behavior_analytics(uuid, integer)` | `authenticated` | 参与度与粗粒度地域分布 |
| `get_campaign_subscribers_with_analytics(uuid)` | `authenticated` | 预约名单及其访问画像 |
| `can_manage_campaign_media(text)` | `authenticated` | Storage 策略使用的归属校验 |
| `get_workspace_analytics(integer)` / `get_workspace_behavior_analytics(integer)` | 仅内部 | 被上面的分析 RPC 调用，已 `revoke` 掉 `public` 与 `authenticated` |
| `prevent_closed_campaign_subscription()` | 触发器 | 在 `subscribers` 写入前阻止已关闭预约入口的活动 |

所有公开 RPC 都是 `security definer` + `set search_path = ''`，因此函数内引用的表名和
函数名必须带 `public.` 前缀，扩展函数带 `extensions.` 前缀。

## 5. 关键请求流

### 5.1 公开页渲染 `/p/[slug]`

1. `src/app/p/[slug]/page.tsx` 服务端调用 `getPublicCampaign(slug)`。
2. 命中未发布、已撤回或 slug 不存在时返回 404，不泄露草稿。
3. 服务端渲染 `public-campaign-experience`，客户端 `page-view-tracker` 负责上报。

### 5.2 访问与参与度上报

1. 客户端在 `localStorage`/`sessionStorage` 生成访客与会话标识；浏览器启用
   Do Not Track 时直接不上报。
2. 首次进入调用 Server Action `trackPageViewAction`：服务端用 Zod 校验载荷，用
   `resolveRequestLocation()` 取粗粒度地域（优先平台请求头，缺失时短超时 IP 查询），
   然后调用 `track_campaign_page_view`。
3. 停留与交互数据通过 `POST /api/analytics/engagement` 调用
   `track_campaign_page_engagement`；演示 slug 与未配置 Supabase 时返回 `204`。

### 5.3 匿名预约

1. `subscribe-form` 提交到 `src/app/p/[slug]/actions.ts`。
2. Server Action 用 Zod 校验邮箱、slug、隐藏字段和问卷答案，并复用
   `src/lib/common-email-domains.ts` 的域名白名单。
3. 通过后调用 `subscribe_to_campaign`；数据库重复执行同样的校验。
4. 前端只显示成功或失败，不区分“首次预约”与“已存在”。

### 5.4 管理端读写

1. `src/proxy.ts` 用 `supabase.auth.getClaims()` 判定登录态，未登录访问
   `/dashboard` 重定向到 `/login` 并带上 `next`。
2. Server Actions 内再用 `getCurrentUser()` 调 `auth.getUser()` 复核身份与活动归属；
   直连表的读写由 RLS 兜底。
3. 统计类数据走分析 RPC，避免把明细聚合逻辑放到客户端。

### 5.5 发布与撤回

- 发布：校验配置 → 写 `draft_config` → 同一次操作把草稿复制到 `published_config`
  → 置 `status = 'published'` 与 `published_at`。
- 撤回：只把 `status` 改回 `draft`（清空公开入口），不删除草稿、媒体、预约或访问数据。
- 删除项目会级联删除订阅者、访问事件与媒体路径，不可撤销。

### 5.6 媒体上传

客户端使用 Publishable Key 直连 Storage（`src/lib/campaign-media.ts`），写入前在
Server Action 中确认活动归属；数据库策略再用 `can_manage_campaign_media()` 独立校验，
因此绕过前端也无法写入他人目录。

## 6. 认证与会话

- Supabase Auth 负责邮箱密码、邮箱确认、数字验证码（Magic Link 模板的 `{{ .Token }}`）
  与密码恢复。
- `/auth/callback` 建立 SSR 会话并按 `src/lib/redirect-path.ts` 决定跳转目标。
- 服务端读取使用 `@supabase/ssr` 的 Cookie 客户端，会话刷新在 proxy 中完成。
- 密码与验证码登录只允许已注册且已确认的账号；验证码发送后 60 秒内不可重发。

## 7. 演示模式

未配置 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 时：

- 应用不创建 Supabase 客户端，所有页面走 `src/lib/campaigns.ts` 中的演示数据，
  写入操作直接返回失败，刷新后修改丢失。
- 演示活动使用固定 slug `ahead-2-preview`，上报接口对该 slug 直接返回 `204`。
- Playwright 正是利用该模式跑主流程，因此 E2E 不依赖任何数据库。

`NEXT_PUBLIC_SUPABASE_ANON_KEY` 仅作为旧部署的兼容回退，新部署不要配置。

## 8. 扩展检查清单

新增能力时按下列顺序同步，避免出现“前端有、数据库没有”的中间态：

- **新增配置字段**：Zod Schema（`src/lib/validation.ts`）→ `src/types/database.ts` →
  预设/默认值（`src/lib/campaign-presets.ts`）→ 编辑器 UI → 公开渲染 →
  `tests/unit/validation.test.ts` → 文档。
- **新增 RPC**：`security definer` + `set search_path = ''` → `revoke all from public` →
  精确签名 `grant` → `tests/unit/database-security.test.ts` → `platform.sql` 与
  `update.sql` 同步。
- **新增公开路由**：确认不需要写权限；需要写权限时优先复用受限 RPC 并写幂等约束。
- **新增环境变量**：先确认能否由现有公开变量推导；必须新增时同步 `.env.example`、
  Vercel 环境配置校验和部署手册。
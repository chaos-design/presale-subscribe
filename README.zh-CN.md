# Ahead 功能预告订阅系统

[English](./README.md)

Ahead 是一个完整的功能预告与预约订阅系统。团队可以创建项目、编辑草稿、发布独立线上版本、撤回页面，并通过可分享链接收集订阅邮箱与问卷回答。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript 严格模式
- shadcn/ui（Base UI）与 Lucide React
- Supabase Auth、Postgres、Storage、RLS 与受限 RPC
- Tailwind CSS 4 与 Biome

## 已实现功能

- 邮箱密码和邮箱验证码登录
- 邮箱密码注册、密码强度提示，打开确认链接后完成验证
- 通过安全邮件回调找回并重置密码
- 服务端验证 Supabase 会话并保护管理路由
- 模板先行工作台，支持项目创建、编辑、删除、发布和撤回
- 账号资料设置
- 预约名单按邮箱或访问来源、地域等元数据搜索、删除和 CSV 导出
- 十六种响应式订阅模板与全屏实时预览
- 可配置的功能介绍、完整长文案、活动图片与预览视频上传
- 可配置的简答、单选和多选问卷，随发布快照锁定
- 十六种策展配色、自定义强调色，以及可调强度、速度和行为的模板适配动效
- 登录流程关联服务条款与隐私政策页面
- 草稿配置和线上配置分离
- `/p/[slug]` 稳定分享地址
- 公开页 PV/UV、来源与设备上报，以及访问、转化、邮箱域名和问卷回答分析
- 邮箱校验、重复订阅幂等处理与加载/错误状态
- 未配置 Supabase 时可直接使用演示数据浏览完整界面

## 本地运行

环境要求：Node.js 22.13 或更高版本（该下限由锁定的 pnpm 11.21 决定，同时写入
`package.json` 的 `engines`）与 pnpm 11.21.0。Supabase 项目是可选的；没有配置时应用运行在只读演示模式。

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

填写两个最小环境变量：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

在 Supabase SQL Editor 中整份执行
[`supabase/platform.sql`](./supabase/platform.sql)。该脚本按功能分区并带有注释，
不需要拆分或按时间顺序运行其他文件，也可用于升级已经执行过旧版初始化脚本的项目。

已运行旧版完整 SQL 的现有项目，如果只需应用当前的预约入口保护与媒体 Storage
上传策略变更，可单独执行
[`supabase/update.sql`](./supabase/update.sql)。
增量脚本不会被本地 `db reset` 自动执行，其内容已经合并进完整 SQL。

脚本会创建或更新：

- `users` 用户资料表
- `subscription_campaigns` 订阅项目表
- `subscribers` 预约邮箱、问卷答卷与匿名转化会话关联
- `campaign_page_views` 公开页访问事件表（访客与会话标识只保存 SHA-256 散列），
  包含停留时长、滚动深度、交互、浏览环境与粗粒度地域
- `campaign-media` 公开活动媒体存储桶
- RLS 策略、用户同步触发器、索引和公开 RPC

### 邮箱认证配置

1. 在 Supabase Authentication 中启用 Email Provider。
2. 保持 **Confirm email** 开启。
3. 在 **Email Templates > Confirm signup** 中渲染 `{{ .ConfirmationURL }}`。用户打开
   链接后回到 `/auth/callback`，建立 Supabase SSR 会话并自动登录。
4. 在 **Email Templates > Magic Link** 中渲染 `{{ .Token }}`。该模板只用于数字验证码
   登录，Ahead 通过 `verifyOtp({ type: "email" })` 校验验证码。
5. 保持 Recovery 模板使用 `{{ .ConfirmationURL }}`，密码重置请求会先经过
   `/auth/callback`，再进入 `/reset-password`。
6. 将本地与生产环境的 `/auth/callback` 加入 Auth 重定向白名单。

密码登录和验证码登录只允许已注册且已确认邮箱的账号。验证码成功发送后 60 秒内不能
再次发送。验证码位数由 Supabase 项目配置决定，前端不额外设置位数上限。注册时填写
邮箱和密码，必须打开确认链接后才能进入工作台；已有账号可以从登录页发起密码重置。

启动开发服务：

```bash
pnpm dev
```

访问 [http://localhost:4433](http://localhost:4433)。没有 `.env.local` 时应用会进入
只读演示模式。需要在本地验证生产构建时执行：

```bash
pnpm build
pnpm start
```

## 文档

- [使用手册](./docs/user-guide.md)
- [开发手册](./docs/development-guide.md)
- [架构说明](./docs/architecture.md)
- [部署手册](./docs/deployment-guide.md)
- [贡献指南](./CONTRIBUTING.zh-CN.md)
- [安全策略](./SECURITY.zh-CN.md)
- [English documentation](./README.md)

## 代码质量

```bash
pnpm check
pnpm test:e2e
pnpm build
```

## 部署

同一个提交有两条发布路径：`main` 变化时由 Vercel Git 集成自动部署 Production，GitHub Actions
负责质量门禁、构建产物归档，并对同一提交做一次不接管生产域名的暂存 Preview 部署。维护者还可
以手动触发 `Publish` 且 `target=production` 的方式执行经过审批的生产发布，或用 `Rollback`
把生产流量切回上一个已验证的 Deployment。

完整的环境变量、构建设置、分支策略、触发条件、故障处理和回滚步骤见
[部署手册](./docs/deployment-guide.md)。项目不需要 `service_role` 密钥。

## 数据与安全

- 所有管理操作都会在服务端重新验证登录用户。
- Proxy 会刷新 Supabase 会话，并将未登录的工作台请求重定向到登录页。
- RLS 按项目所有者隔离配置和订阅数据。
- Storage 策略只允许登录用户向自己活动的目录上传图片或视频。
- 匿名用户不能直接查询项目表或订阅者表。
- 公开读取、预约与访问上报只开放字段受限的 `security definer` RPC，且只处理已发布快照。
- 访问统计不保存 IP 或原始 User-Agent，浏览器开启 Do Not Track 时不会上报；地域信息
  优先使用平台请求头，缺失时才在服务端临时解析 IP。
- 问卷答案会按已发布题目、必填规则和选择题白名单在服务端与数据库 RPC 中校验。
- 同一项目下同一邮箱只保存一次。

安全问题请按 [SECURITY.zh-CN.md](./SECURITY.zh-CN.md) 私密报告，不要提交公开 Issue。

## 开源许可

本项目基于 [Apache License 2.0](./LICENSE) 发布，贡献内容同样按该许可授权。

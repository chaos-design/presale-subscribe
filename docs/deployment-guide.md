# Ahead 部署手册

[English](./deployment-guide.en.md)

本文说明 Ahead 在 Vercel 与 Supabase 上的生产部署流程。仓库以 GitHub Actions 为唯一
发布入口，Vercel Git 自动部署已由 `vercel.json` 关闭，避免同一提交被重复构建和发布。

数据模型与安全边界见[架构说明](./architecture.md)，仓库权限与发布门禁见
[贡献指南](../CONTRIBUTING.zh-CN.md)，漏洞报告渠道见[安全策略](../SECURITY.zh-CN.md)。

## 1. 部署架构

- Vercel 运行 Next.js 16 应用、Server Actions 和 Route Handlers。
- Supabase 提供 Auth、Postgres、Storage、RLS 和公开受限 RPC。
- Pull Request 通过 `.github/workflows/ci.yml` 验证，不直接部署。
- `main` 分支更新通过 `.github/workflows/publish.yml` 自动发布到 Production。
- 任意分支可以从 GitHub Actions 手动发布到 Preview。
- 生产故障通过 `.github/workflows/rollback.yml` 人工回滚。

应用不需要也不得配置 Supabase `service_role` 密钥。浏览器和服务端只使用公开的
Supabase URL 与 Publishable Key，数据权限由 RLS 和 RPC 保证。

## 2. 前置条件

- GitHub 仓库及 Actions 执行权限。
- Vercel 项目及可创建 Deployment 的访问令牌。
- Supabase 项目；建议 Preview 和 Production 使用不同项目。
- Node.js 22.13 或更高版本（由 `package.json` 的 `engines` 声明，该下限来自 pnpm 11.21）、pnpm 11.21.0。
- GitHub CLI，仅在执行分支保护脚本时需要。
- 仓库设置：**Settings > Code security > Private vulnerability reporting** 建议开启，
  以便[安全策略](../SECURITY.zh-CN.md)中的私密报告渠道可用。

## 3. 初始化 Supabase

1. 为需要隔离的 Preview 和 Production 环境分别新建 Supabase 项目。以下步骤必须在
   每个项目中完整执行。
2. 在各项目的 SQL Editor 中整份执行 `supabase/platform.sql`。新项目无需再执行
   `supabase/update.sql`。
3. 在 Authentication 中启用 Email Provider，并保持 **Confirm email** 开启。
4. 配置邮件模板：
   - Confirm signup：使用 `{{ .ConfirmationURL }}`。
   - Magic Link：使用 `{{ .Token }}` 发送数字验证码。
   - Recovery：使用 `{{ .ConfirmationURL }}`。
5. 在 **URL Configuration** 中设置生产 Site URL，并将以下地址加入 Redirect URLs：
   - `http://localhost:4433/auth/callback`
   - `https://<生产域名>/auth/callback`
   - Preview 使用的受控域名或分支域名 `/auth/callback`
6. 确认 `users`、`subscription_campaigns`、`subscribers`、
   `campaign_page_views` 已启用 RLS。
7. 确认公开读取的 `campaign-media` bucket 已创建，所有者目录的上传、更新和删除策略
   生效。

`platform.sql` 可重复执行，会统一创建或更新表、索引、触发器、RLS、RPC 和 Storage
策略。已经运行旧版全量 SQL 的项目可以执行最新 `platform.sql` 完整校准，或只执行当前
`update.sql`。不要在新项目中依次运行这两个文件，全量脚本已经包含增量内容。

## 4. 创建 Vercel 项目

1. 在 Vercel 新建项目并关联 GitHub 仓库。
2. 将 Root Directory 保持为仓库根目录。
3. Framework Preset 选择 **Next.js**。
4. Node.js Version 选择 **20.x**。
5. 不设置 Output Directory，使用 Next.js 默认输出。
6. 首次导入可以先不触发部署；完成环境变量和 Supabase 回调配置后，再从 GitHub
   Actions 发布 Preview。

仓库中的 `vercel.json` 固定以下设置：

```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "git": {
    "deploymentEnabled": false
  }
}
```

不要在 Vercel 控制台覆盖这些命令。`git.deploymentEnabled: false` 只关闭 Vercel Git
集成的自动构建，不影响 GitHub Actions 调用 Vercel CLI 发布。

## 5. 配置环境变量

在 Vercel **Project Settings > Environment Variables** 中分别为 Preview 和
Production 配置：

| 变量 | 必需 | 作用 | 配置范围 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | Supabase 项目 HTTPS URL | Preview、Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 是 | Supabase Publishable Key | Preview、Production |

注意：

- 两个变量带有 `NEXT_PUBLIC_` 前缀，会进入浏览器构建产物，因此只能填写公开密钥。
- 不要配置 `SUPABASE_SERVICE_ROLE_KEY`，也不要把密钥写入仓库或 GitHub Actions 日志。
- Preview 与 Production 建议指向不同 Supabase 项目，避免测试预约进入生产数据。
- 环境变量更新只影响后续 Deployment；更新后必须重新执行发布。
- `VERCEL_URL` 等系统变量由 Vercel 注入，无需手工添加。

发布工作流执行 `vercel pull` 后，会在不打印变量值的前提下检查两个必需变量、URL 的
HTTPS 格式和示例占位值。校验失败时不会构建或发布只读演示版本。

## 6. 配置 GitHub Actions

在 GitHub 仓库 **Settings > Secrets and variables > Actions** 中配置：

| Secret | 获取方式 | 用途 |
| --- | --- | --- |
| `VERCEL_TOKEN` | Vercel Account Settings > Tokens | Vercel CLI 身份认证 |
| `VERCEL_ORG_ID` | `.vercel/project.json` 的 `orgId` | 绑定 Vercel 团队或账号 |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` 的 `projectId` | 绑定目标项目 |

可以先在本机执行一次 `pnpm dlx vercel@59.3.0 link` 获取项目标识，但不要提交生成的
`.vercel/` 目录。

在 GitHub **Settings > Environments** 中创建：

- `preview`：允许维护者手动部署，可按团队需要添加审批。
- `production`：必须限制仅 `main` 分支可用，并配置 Required reviewers 与
  **Prevent self-review**。若仓库套餐不支持这些规则，必须先建立等效的外部双人审批，
  否则回滚工作流没有独立审批门禁。

Secrets 可以放在仓库级；若不同环境使用不同 Vercel 项目，则分别放入对应 GitHub
Environment。Supabase 变量仍应配置在 Vercel，不要重复放入 GitHub Secrets。

## 7. 分支策略与触发条件

| 事件 | 工作流 | 结果 |
| --- | --- | --- |
| 向 `main` 提交 Pull Request | `CI` | 执行 Biome、类型检查、单元测试、构建和 E2E |
| 手动执行 `CI` | `CI` | 验证当前选择的分支，不部署 |
| Push 或合并到 `main` | `Publish` | 质量门禁通过后自动部署 Production |
| 手动执行 `Publish`，选择 `preview` | `Publish` | 部署当前选择分支到 Preview |
| 手动执行 `Publish`，选择 `production` | `Publish` | 仅当所选分支为 `main` 时部署 Production |
| 从 `main` 手动执行 `Rollback` | `Rollback` | 经 Production 环境审批后回滚生产流量 |

推荐使用短生命周期功能分支，经 Pull Request 合并到受保护的 `main`。可执行以下命令
配置仓库提供的保护规则：

```bash
GH_TOKEN=<具有仓库管理权限的令牌> \
  ./scripts/configure-branch-protection.sh owner/repository main
```

脚本要求 `quality` 和 `e2e` 检查通过、至少一人审批、最后一次提交由他人审批、对话已
解决、线性历史，并禁止强制推送和删除分支。仓库套餐或组织策略不支持某项规则时，应在
GitHub 设置中手工配置等价规则。

## 8. 发布流程

`Publish` 工作流按以下顺序执行，任一步失败都会阻止后续发布：

1. `quality` 执行 `pnpm check`。
2. `e2e` 在显式清空 Supabase 变量的演示模式下运行 Playwright。Playwright 会先执行
   `pnpm build` 并用 `next start` 提供服务，因此该 Job 同时验证生产构建可运行。
3. `deploy` 校验 Vercel 凭据和目标环境；Production 只接受 `main`。
4. `vercel pull` 拉取目标环境设置；Preview 同时传入当前分支名，以应用分支级变量。
5. 校验必需的 Supabase 环境变量，但不输出变量值。
6. `vercel build` 生成 `.vercel/output`。
7. 将构建输出打包为保留 30 天的 GitHub Actions Artifact。
8. 部署命令附加 GitHub 分支和提交元数据，使 CLI Deployment 正确关联分支。
   Preview 直接执行 `vercel deploy --prebuilt`；Production 使用 `--prod --skip-domain`
   创建暂存生产 Deployment。
9. Production 通过 `vercel promote` 显式切换生产域名。这也会解除 Instant Rollback
   后的域名自动指派暂停状态。
10. 在 Job Summary 中记录环境、版本和 Deployment URL。
11. 独立的最小权限 `release` Job 创建
    `v<major>.<minor>.<run-number>` GitHub Release，并附加下载的构建产物。

Preview 和 Production 使用独立并发组。常规生产发布不会中断正在运行的发布，但
GitHub 同一并发组只保留最新的等待任务；生产回滚会主动取消正在运行的生产发布并优先
执行。处理事故期间应暂停向 `main` 合并新提交。Vercel CLI 版本固定在工作流中，升级
时应同时更新发布、回滚工作流并重新验证。

## 9. 首次发布

### 上线前检查表

| 检查项 | 操作 | 通过标准 |
| --- | --- | --- |
| Node 版本 | Vercel Project Settings > Node.js Version | 满足 `engines` 的 `>=22.13.0`，建议与 CI 一致使用 22.x |
| 构建命令 | 不覆盖 `vercel.json` 中的 `installCommand` 与 `buildCommand` | Dashboard 中无自定义覆盖 |
| Supabase 生产库 | SQL Editor 整份执行 `supabase/platform.sql` | 四张业务表启用 RLS，`campaign-media` bucket 存在 |
| 认证回调 | Supabase URL Configuration | 生产与 Preview 的 `/auth/callback` 都在 Redirect URLs 中 |
| 环境变量 | Vercel Preview / Production | 两个 `NEXT_PUBLIC_SUPABASE_*` 均为真实值且 URL 为 HTTPS |
| 仓库指向 | `src/lib/product-config.ts` | `productCredit.githubUrl` 指向该部署的源码仓库 |
| 门禁 | `main` 分支保护 | `quality` 与 `e2e` 为必需检查，至少一人审批 |
| 审批 | GitHub Environments | `production` 限制 `main`，配置 Required reviewers 与 Prevent self-review |
| 安全报告 | Settings > Code security | 已开启 Private vulnerability reporting |
| 域名 | Vercel Domains | 生产域名已绑定，DNS 已生效 |

### 发布步骤

1. 从 GitHub Actions 打开 **Publish**。
2. 选择已经通过 CI 的分支，将 `target` 设为 `preview`。
3. 从 Job Summary 取得 Preview URL，先确认首页可访问。
4. 将该 Preview URL 的 `/auth/callback` 和 Production 回调地址加入对应 Supabase
   项目的 Redirect URLs。
5. 完成下节的 Preview 验收。
6. 合并 Pull Request 到 `main`，等待 Production 自动发布。
7. 为生产域名配置 DNS 后，再次验证认证回调和公开预约页。

## 10. 发布验收

### Preview 验收

Preview 使用独立的 Supabase 项目，只验证功能与数据隔离：

| 检查项 | 通过标准 |
| --- | --- |
| 首页与静态页 | 首页、登录页、服务条款、隐私政策可访问 |
| 认证闭环 | 注册确认、密码登录、验证码登录、密码恢复全部可用 |
| 工作台隔离 | 未登录访问 `/dashboard` 跳转登录页 |
| 发布闭环 | 可创建项目、保存草稿、发布、撤回、重新发布 |
| 快照隔离 | 保存草稿不改变已发布页，重复邮箱幂等，问卷必答与选项校验生效 |
| 分析可用 | PV/UV、来源、设备、参与度、问卷结果可读取 |
| 名单操作 | 预约详情、单条删除与 CSV 导出正常 |
| 越权防护 | 另一账号无法访问该项目的活动、预约与媒体目录 |
| 数据隔离 | Preview 数据库中不出现生产预约数据 |

### Production 验收

合并到 `main` 并完成 DNS 后，至少完成以下检查：

- 首页、登录页、服务条款和隐私政策可访问。
- 注册确认、密码登录、数字验证码登录和密码恢复可完成。
- 未登录访问 `/dashboard` 会跳转登录页。
- 可以创建项目、上传图片和视频、保存草稿并发布。
- 保存草稿不会改变已发布页面；再次发布才替换线上快照。
- `/p/[slug]` 可以预约，重复邮箱保持幂等，问卷规则正常生效。
- 数据分析可以读取 PV、UV、参与度和问卷结果。
- 预约详情、删除和 CSV 导出正常。
- 撤回后公开页立即不可访问，重新发布后恢复。
- 一个账号不能访问其他账号的活动、预约或媒体目录。

## 11. 错误处理

| 阶段 | 常见现象 | 处理方式 |
| --- | --- | --- |
| 依赖安装 | lockfile 不一致 | 本地运行 `pnpm install` 更新并提交 `pnpm-lock.yaml` |
| 质量门禁 | Biome、类型或测试失败 | 在原分支修复；不要跳过门禁直接生产发布 |
| E2E | 页面断言失败 | 下载保留 7 天的 Playwright Artifact 查看报告与截图 |
| 凭据校验 | `Missing required secret` | 检查 GitHub Secret 名称、Environment 范围和令牌权限 |
| 环境校验 | Supabase 变量缺失或 URL 非 HTTPS | 修正 Vercel 目标环境变量后重新运行工作流 |
| Vercel 构建 | Next.js 编译或运行时打包失败 | 查看 `Build Vercel output` 日志并本地运行 `pnpm build` |
| 部署 | Vercel API、配额或网络错误 | 查看 Vercel Deployment 日志；确认无平台故障后重新运行 |
| 提升 | `vercel promote` 失败 | 当前生产流量保持不变；检查暂存 Deployment 后重试发布 |
| 发布后 | 认证回调失败 | 检查 Supabase Site URL、Redirect URLs 和邮件模板 |
| 发布后 | 数据或上传失败 | 检查 SQL 版本、RLS、RPC、Storage bucket 与策略 |

构建或部署失败不会改变当前生产流量。若部署已经成功，但后续 GitHub Release 步骤失败，
Vercel Deployment 仍可能处于线上；应先检查 Job Summary 和 Vercel Dashboard，再仅
重试失败的工作流。

## 12. 回滚方案

应用版本故障使用 Vercel Instant Rollback。它只切换生产流量，不会修改 Supabase
Schema、数据或 Vercel Project Settings；但目标 Deployment 会继续使用其构建时的
环境配置，本项目的 `NEXT_PUBLIC_SUPABASE_*` 值也已固化在旧构建中。

推荐操作：

1. 在 Vercel Dashboard 的 Deployments 中找到上一个已验证的 Production
   Deployment，复制其 `dpl_...` ID 或生成的 `*.vercel.app` URL。
2. 打开 GitHub Actions 的 **Rollback** 工作流，并确认运行分支为 `main`。
3. 在 `deployment` 中填写 ID 或 URL，在 `confirmation` 中准确输入 `ROLLBACK`。
4. 通过 `production` Environment 审批并等待工作流完成。
5. 核对目标 Deployment 使用的 Supabase 配置与当前数据库兼容。
6. 验证生产域名已指向目标版本，并检查登录、公开页和预约写入。
7. 修复根因后走正常 Pull Request 和 Production 发布；工作流会显式 Promote 新版本
   并恢复正常生产域名指派。

也可以由有权限的维护者在已连接项目的终端执行：

```bash
pnpm dlx vercel@59.3.0 rollback <deployment-id-or-url> --yes --timeout=5m
```

Vercel Hobby 计划通常只允许回滚到前一个生产 Deployment。需要撤销回滚时，使用
Vercel Dashboard 或 `vercel promote <deployment-id-or-url>` 重新提升指定版本。

数据库变更必须采用前向修复：先备份数据，在独立环境验证兼容 SQL，再执行生产变更。
不要通过 Vercel 回滚假设数据库会恢复，也不要直接手工逆转已经写入生产的数据。

## 13. 运维注意事项

- 定期轮换 `VERCEL_TOKEN`，删除离职成员和不再使用的部署权限。
- Production 环境变量变更和每次回滚都应记录原因、操作者、目标版本及验证结果。
- 发布前先验证 `supabase/update.sql`，并确认内容已合并进 `platform.sql`。
- GitHub Release 与 30 天构建 Artifact 用于审计和定位，不替代源码与数据库备份。
- 公开媒体 bucket 中的对象可通过已知 URL 访问，不要上传隐私或机密文件。

## 14. 密钥与环境变量轮换

`NEXT_PUBLIC_*` 会被编译进浏览器产物，更新后必须重新构建发布，历史 Deployment 与
Instant Rollback 仍会使用旧值。因此轮换 Supabase 公开密钥等同于一次正式发布。

轮换 `VERCEL_TOKEN`：

1. 在 Vercel **Account Settings > Tokens** 创建新 Token，勾选项目所需的最小作用域。
2. 更新 GitHub Secret `VERCEL_TOKEN`（若 Preview 与 Production 使用不同 Vercel 项目，
   分别更新对应 Environment 的 Secret）。
3. 在 Vercel 撤销旧 Token。
4. 手动触发一次 **Publish > preview** 验证凭据可用，再继续常规发布。

轮换 Supabase Publishable Key：

1. 在 Supabase **Project Settings > API** 生成新的 Publishable/Anon Key。
2. 更新 Vercel 对应环境的 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
3. 先发布 Preview 并完成第 10 节的 Preview 验收。
4. 合并到 `main` 触发 Production 发布，复核登录、预约与分析。
5. 确认无异常后在 Supabase 撤销旧 Key。

`VERCEL_ORG_ID` 与 `VERCEL_PROJECT_ID` 只在更换 Vercel 账号或项目时变化，取值来自
`.vercel/project.json`，不要提交该目录。

## 15. 数据库变更发布

1. 变更先合并进 `supabase/platform.sql`，必要时同步写入 `supabase/update.sql`。
2. 先在 Preview 对应的 Supabase 项目执行脚本，确认无报错。
3. 备份生产库后，在生产项目 SQL Editor 中执行同一脚本；`platform.sql` 可重复执行。
4. 执行后校验：四张表启用 RLS；`campaign_page_views` 索引存在；`campaign-media`
   bucket 存在；`anon` 角色对业务表仍无 `SELECT`/`INSERT` 授权。
5. 立即完成第 10 节 Production 验收，重点验证公开预约与数据分析。

`platform.sql` 和 `update.sql` 都可重复执行。`update.sql` 在已经执行过当前
`platform.sql` 的项目上重复运行不会产生任何差异，因此旧项目升级与新项目初始化可以使用
同一套验证步骤。增量脚本中的分析 RPC 与全量脚本保持一致实现，不依赖任何只在旧版本中存在
的函数。

数据库变更只做前向修复。Vercel 回滚不会回退 Schema，任何回退都应通过新的 SQL 变更
完成，并先在 Preview 验证。

## 16. 非 Vercel 环境的生产运行

项目默认以 Vercel + GitHub Actions 发布，但应用本身只依赖 Node.js 与两个公开环境变量，
可以自建运行：

```bash
pnpm install --frozen-lockfile
pnpm build
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... pnpm start
```

`dev` 与 `start` 固定使用 4433 端口；需要其他端口时直接执行
`next start --port <port>`。自建环境需要自行承担 TLS 终止、进程守护、预览与生产隔离、
密钥保管，并且不再享受 Instant Rollback。

Vercel CLI 参考：
[Deploying from CI](https://vercel.com/docs/deployments/ci-cd),
[Environment Variables](https://vercel.com/docs/environment-variables),
[Instant Rollback](https://vercel.com/docs/instant-rollback)。

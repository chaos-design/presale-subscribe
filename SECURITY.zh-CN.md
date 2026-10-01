# 安全策略

[English](./SECURITY.md)

## 支持版本

Ahead 从 `main` 分支部署，只有 `main` 上的最新提交会获得安全修复；自建部署请定期拉取
最新代码或重新发布。

| 版本 | 是否支持 |
| --- | --- |
| `main`（当前生产版本） | 是 |
| 更早的提交与个人分支 | 否 |

## 报告安全问题

请通过 GitHub Security Advisories 私密报告：

1. 打开仓库页面，进入 **Security** → **Advisories** → **New draft advisory**。
2. 写明问题、涉及的提交或版本，以及影响范围。
3. 不要为同一问题创建公开 Issue、Pull Request 或讨论。

维护者会在三个工作日内确认收到，并在修复发布前持续同步进展。如果仓库未开启私密
Issue 提交功能，请先向维护者索取私密联系方式，再披露任何细节。

报告中不要包含：

- 访问令牌、Publishable Key、`service_role` 密钥或 `.env` 内容。
- 真实预约邮箱或导出的 CSV 数据。
- 分析功能采集到的访客个人数据。

请脱敏后描述数据结构本身。

## 本项目的安全模型

应用只使用 Supabase Publishable Key，没有可在服务端提权的特权密钥。违反以下任一不变量
的问题按高危处理：

- `anon` 角色不得拥有 `users`、`subscription_campaigns`、`subscribers`、
  `campaign_page_views` 的 `SELECT` 或 `INSERT` 权限；公开读取、匿名预约与访问上报必须
  通过已从 `public` 回收、并按精确签名授权的 `security definer` RPC。
- 公开页只渲染 `status = 'published'` 的 `published_config`。没有登录所有者会话时，
  草稿内容必须不可访问。
- 管理端 Server Action 在服务端重新验证调用者与活动归属；RLS 是第二道防线，不是唯一
  防线。
- 匿名预约在同一活动与邮箱下幂等，且不得泄露该邮箱是否已预约。
- 问卷答案必须在 Server Action 与 RPC 中都按已发布题目、必填规则和选项白名单校验。
- 分析数据只保存访客与会话标识的 SHA-256 散列，不得持久化原始标识、IP 或原始
  User-Agent；浏览器开启 Do Not Track 时完全不上报。
- Storage 策略把写入限制在调用者拥有的 `{userId}/{campaignId}/...` 路径。

`campaign-media` 是公开存储桶：任何拿到对象 URL 的人都能读取文件。不要上传机密内容，
已发布媒体一律按公开信息对待。

## 部署方责任

自建实例的运维方需要负责：

- 让 `VERCEL_TOKEN`、GitHub Secrets 与 Supabase 密钥不进入仓库与构建日志，并定期轮换、
  在成员变动后立即轮换。
- 把 Supabase Authentication 的重定向地址限制在已知域名。
- 保持 `main` 分支保护，明确谁可以审批 `production` 部署与回滚。
- 只执行经过评审的 SQL，并按[部署手册](./docs/deployment-guide.md)描述的顺序应用数据库
  变更。

## 依赖

依赖由 pnpm 管理并通过 `pnpm-lock.yaml` 锁定。依赖漏洞按应用漏洞同样方式报告，并说明
受影响版本与建议的修复版本区间。
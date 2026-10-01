-- 平台完整数据库脚本（唯一权威全量 SQL）
--
-- 使用方式：
-- 1. 在 Supabase SQL Editor 中打开本文件。
-- 2. 整份执行，不需要拆分或按顺序运行其他 SQL。
-- 3. 脚本可在新项目或已经执行过旧版初始化脚本的项目中重复执行。
-- 4. 已部署旧版且只需要本次变更时，可执行 update.sql。
--
-- 覆盖范围：
-- - 用户资料、订阅活动、预约邮箱与问卷答卷
-- - 草稿与已发布快照
-- - RLS 所有权隔离
-- - 公开页面读取、匿名预约与隐私友好的 PV/UV 上报 RPC
-- - 按项目隔离的访问、转化与预约问卷分析
-- - 活动图片与视频 Storage bucket 与访问策略

begin;

-- =============================================================================
-- 1. PostgreSQL 扩展与枚举
-- =============================================================================

create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regtype('public.campaign_status') is null then
    create type public.campaign_status as enum ('draft', 'published');
  end if;
end;
$$;

-- =============================================================================
-- 2. 核心业务表
-- =============================================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  status public.campaign_status not null default 'draft',
  draft_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(draft_config) = 'object'),
  published_config jsonb
    check (published_config is null or jsonb_typeof(published_config) = 'object'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null
    references public.subscription_campaigns(id) on delete cascade,
  email extensions.citext not null,
  answers jsonb not null default '{}'::jsonb
    constraint subscribers_answers_object_check
    check (jsonb_typeof(answers) = 'object'),
  visitor_hash text check (visitor_hash is null or char_length(visitor_hash) = 64),
  session_hash text check (session_hash is null or char_length(session_hash) = 64),
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create table if not exists public.campaign_page_views (
  id bigint generated always as identity primary key,
  campaign_id uuid not null
    references public.subscription_campaigns(id) on delete cascade,
  view_hash text not null check (char_length(view_hash) = 64),
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  session_hash text not null check (char_length(session_hash) = 64),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 253),
  source text not null default 'direct' check (char_length(source) between 1 and 80),
  medium text check (medium is null or char_length(medium) <= 80),
  campaign_tag text check (campaign_tag is null or char_length(campaign_tag) <= 120),
  device_type text not null default 'unknown'
    check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  locale text check (locale is null or char_length(locale) <= 35),
  timezone text check (timezone is null or char_length(timezone) <= 64),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  region text check (region is null or char_length(region) <= 120),
  city text check (city is null or char_length(city) <= 120),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  max_scroll_depth smallint not null default 0 check (max_scroll_depth between 0 and 100),
  interaction_count integer not null default 0 check (interaction_count between 0 and 10000),
  viewed_at timestamptz not null default now(),
  unique (campaign_id, view_hash)
);

-- 兼容只执行过早期脚本、尚未创建问卷字段的数据库。
alter table public.subscribers
add column if not exists answers jsonb not null default '{}'::jsonb;
alter table public.subscribers
add column if not exists visitor_hash text
  check (visitor_hash is null or char_length(visitor_hash) = 64);
alter table public.subscribers
add column if not exists session_hash text
  check (session_hash is null or char_length(session_hash) = 64);

alter table public.campaign_page_views
add column if not exists locale text check (locale is null or char_length(locale) <= 35);
alter table public.campaign_page_views
add column if not exists timezone text check (timezone is null or char_length(timezone) <= 64);
alter table public.campaign_page_views
add column if not exists country_code text
  check (country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.campaign_page_views
add column if not exists region text check (region is null or char_length(region) <= 120);
alter table public.campaign_page_views
add column if not exists city text check (city is null or char_length(city) <= 120);
alter table public.campaign_page_views
add column if not exists duration_seconds integer not null default 0
  check (duration_seconds between 0 and 86400);
alter table public.campaign_page_views
add column if not exists max_scroll_depth smallint not null default 0
  check (max_scroll_depth between 0 and 100);
alter table public.campaign_page_views
add column if not exists interaction_count integer not null default 0
  check (interaction_count between 0 and 10000);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscribers_answers_object_check'
      and conrelid = 'public.subscribers'::regclass
  ) then
    alter table public.subscribers
    add constraint subscribers_answers_object_check
    check (jsonb_typeof(answers) = 'object');
  end if;
end;
$$;

comment on table public.users is '用户公开资料，与 auth.users 一一对应';
comment on table public.subscription_campaigns is '订阅活动、草稿配置与已发布快照';
comment on table public.subscribers is '活动预约邮箱与结构化问卷答卷';
comment on table public.campaign_page_views is
  '公开活动访问事件，仅保存散列访客标识、来源与设备分类，不保存 IP 或原始 User-Agent';
comment on column public.subscription_campaigns.draft_config is
  '可编辑草稿，保存不会直接改变公开页面';
comment on column public.subscription_campaigns.published_config is
  '发布时从草稿复制的公开只读快照';
comment on column public.subscribers.answers is
  '以发布快照中的 question id 为键的问卷回答 JSON 对象';
comment on column public.subscribers.visitor_hash is
  '预约提交时的匿名访客标识散列，用于关联访问行为';
comment on column public.subscribers.session_hash is
  '预约提交时的匿名会话标识散列，用于识别转化会话';

-- =============================================================================
-- 3. 查询索引
-- =============================================================================

create index if not exists subscription_campaigns_user_id_idx
  on public.subscription_campaigns(user_id);
create index if not exists subscription_campaigns_status_idx
  on public.subscription_campaigns(status);
create index if not exists subscribers_campaign_id_created_at_idx
  on public.subscribers(campaign_id, created_at desc);
create index if not exists subscribers_campaign_id_visitor_hash_idx
  on public.subscribers(campaign_id, visitor_hash);
create index if not exists campaign_page_views_campaign_id_viewed_at_idx
  on public.campaign_page_views(campaign_id, viewed_at desc);
create index if not exists campaign_page_views_campaign_id_visitor_hash_idx
  on public.campaign_page_views(campaign_id, visitor_hash, viewed_at desc);

-- =============================================================================
-- 4. 更新时间与用户资料同步触发器
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_campaigns_updated_at on public.subscription_campaigns;
create trigger set_campaigns_updated_at
before update on public.subscription_campaigns
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 为脚本执行前已经存在的认证用户补齐业务资料。
insert into public.users (id, full_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

comment on function public.set_updated_at() is '在业务表更新时刷新 updated_at';
comment on function public.handle_new_user() is '认证用户创建后同步用户资料';

-- =============================================================================
-- 5. Row Level Security
-- =============================================================================

alter table public.users enable row level security;
alter table public.subscription_campaigns enable row level security;
alter table public.subscribers enable row level security;
alter table public.campaign_page_views enable row level security;

drop policy if exists "Users can read their profile" on public.users;
create policy "Users can read their profile"
on public.users for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update their profile" on public.users;
create policy "Users can update their profile"
on public.users for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Owners can read campaigns" on public.subscription_campaigns;
create policy "Owners can read campaigns"
on public.subscription_campaigns for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Owners can create campaigns" on public.subscription_campaigns;
create policy "Owners can create campaigns"
on public.subscription_campaigns for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can update campaigns" on public.subscription_campaigns;
create policy "Owners can update campaigns"
on public.subscription_campaigns for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners can delete campaigns" on public.subscription_campaigns;
create policy "Owners can delete campaigns"
on public.subscription_campaigns for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Owners can read campaign subscribers" on public.subscribers;
create policy "Owners can read campaign subscribers"
on public.subscribers for select
to authenticated
using (
  exists (
    select 1
    from public.subscription_campaigns
    where subscription_campaigns.id = subscribers.campaign_id
      and subscription_campaigns.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners can delete campaign subscribers" on public.subscribers;
create policy "Owners can delete campaign subscribers"
on public.subscribers for delete
to authenticated
using (
  exists (
    select 1
    from public.subscription_campaigns
    where subscription_campaigns.id = subscribers.campaign_id
      and subscription_campaigns.user_id = (select auth.uid())
  )
);

drop policy if exists "Owners can read campaign page views" on public.campaign_page_views;
create policy "Owners can read campaign page views"
on public.campaign_page_views for select
to authenticated
using (
  exists (
    select 1
    from public.subscription_campaigns
    where subscription_campaigns.id = campaign_page_views.campaign_id
      and subscription_campaigns.user_id = (select auth.uid())
  )
);

-- =============================================================================
-- 6. 管理端与公开页面 RPC
-- =============================================================================

create or replace function public.get_campaigns_with_counts()
returns table (
  id uuid,
  user_id uuid,
  name text,
  slug text,
  status public.campaign_status,
  draft_config jsonb,
  published_config jsonb,
  subscriber_count bigint,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    campaign.id,
    campaign.user_id,
    campaign.name,
    campaign.slug,
    campaign.status,
    campaign.draft_config,
    campaign.published_config,
    count(subscriber.id) as subscriber_count,
    campaign.published_at,
    campaign.created_at,
    campaign.updated_at
  from public.subscription_campaigns as campaign
  left join public.subscribers as subscriber
    on subscriber.campaign_id = campaign.id
  group by campaign.id
  order by campaign.updated_at desc;
$$;

create or replace function public.get_published_campaign(p_slug text)
returns table (
  id uuid,
  slug text,
  published_config jsonb,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    campaign.id,
    campaign.slug,
    campaign.published_config,
    campaign.published_at
  from public.subscription_campaigns as campaign
  where campaign.slug = p_slug
    and campaign.status = 'published'
    and campaign.published_config is not null
  limit 1;
$$;

-- 删除旧的双参数版本与可能存在的三参数版本，保证只有一个公开预约入口。
drop function if exists public.subscribe_to_campaign(text, text);
drop function if exists public.subscribe_to_campaign(text, text, jsonb);
drop function if exists public.subscribe_to_campaign(text, text, jsonb, text, text);

create function public.subscribe_to_campaign(
  p_slug text,
  p_email text,
  p_answers jsonb default '{}'::jsonb,
  p_visitor_id text default null,
  p_session_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_campaign_id uuid;
  target_config jsonb;
  questionnaire jsonb;
  question jsonb;
  answer jsonb;
  question_id text;
  question_type text;
begin
  -- 邮箱长度与基础格式限制。
  if char_length(trim(p_email)) > 254
    or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  then
    raise exception 'Invalid email address';
  end if;

  if (p_visitor_id is not null and p_visitor_id !~ '^[A-Za-z0-9_-]{16,128}$')
    or (p_session_id is not null and p_session_id !~ '^[A-Za-z0-9_-]{16,128}$')
  then
    raise exception 'Invalid analytics identifier';
  end if;

  -- 公开预约只接受常用邮箱服务商，减少临时域名和误填地址。
  if lower(split_part(trim(p_email), '@', 2)) not in (
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'yahoo.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'proton.me',
    'protonmail.com',
    'qq.com',
    'foxmail.com',
    '163.com',
    '126.com',
    'yeah.net',
    'sina.com',
    'sina.cn',
    'sohu.com',
    '139.com',
    '189.cn',
    'aliyun.com'
  ) then
    raise exception 'Unsupported email domain';
  end if;

  -- 答卷只接受体积受限的 JSON 对象，阻止匿名用户写入任意大数据。
  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object'
    or pg_column_size(coalesce(p_answers, '{}'::jsonb)) > 16384
  then
    raise exception 'Invalid questionnaire answers';
  end if;

  -- 公开预约只能命中当前处于发布状态的活动快照。
  select campaign.id, campaign.published_config
  into target_campaign_id, target_config
  from public.subscription_campaigns as campaign
  where campaign.slug = p_slug
    and campaign.status = 'published'
    and campaign.published_config is not null;

  if target_campaign_id is null then
    raise exception 'Published campaign not found';
  end if;

  if coalesce((target_config #>> '{sectionVisibility,signup}')::boolean, true) = false then
    raise exception 'Campaign subscription is closed';
  end if;

  questionnaire := coalesce(target_config -> 'questionnaire', '{}'::jsonb);

  if coalesce((questionnaire ->> 'enabled')::boolean, false) then
    -- 不允许提交发布快照中不存在的题目 ID。
    if exists (
      select 1
      from jsonb_object_keys(coalesce(p_answers, '{}'::jsonb)) as answer_keys(answer_key)
      where not exists (
        select 1
        from jsonb_array_elements(
          coalesce(questionnaire -> 'questions', '[]'::jsonb)
        ) as items(item)
        where item ->> 'id' = answer_key
      )
    ) then
      raise exception 'Unknown questionnaire answer';
    end if;

    for question in
      select value
      from jsonb_array_elements(coalesce(questionnaire -> 'questions', '[]'::jsonb))
    loop
      question_id := question ->> 'id';
      question_type := question ->> 'type';
      answer := p_answers -> question_id;

      if coalesce((question ->> 'required')::boolean, false) then
        if answer is null
          or answer = 'null'::jsonb
          or (
            jsonb_typeof(answer) = 'string'
            and char_length(trim(answer #>> '{}')) = 0
          )
        then
          raise exception 'Missing required questionnaire answer';
        end if;

        if jsonb_typeof(answer) = 'array' then
          if jsonb_array_length(answer) = 0 then
            raise exception 'Missing required questionnaire answer';
          end if;
        end if;
      end if;

      if answer is null then
        continue;
      end if;

      if question_type = 'short_text' then
        if jsonb_typeof(answer) <> 'string'
          or char_length(trim(answer #>> '{}')) > 500
        then
          raise exception 'Invalid short text answer';
        end if;
      elsif question_type = 'single_choice' then
        if jsonb_typeof(answer) <> 'string'
          or not exists (
            select 1
            from jsonb_array_elements_text(
              coalesce(question -> 'options', '[]'::jsonb)
            ) as options(option)
            where option = answer #>> '{}'
          )
        then
          raise exception 'Invalid single choice answer';
        end if;
      elsif question_type = 'multiple_choice' then
        if jsonb_typeof(answer) <> 'array' then
          raise exception 'Invalid multiple choice answer';
        end if;

        if jsonb_array_length(answer) > 8
          or exists (
            select 1
            from jsonb_array_elements(answer) as selections(selected)
            where jsonb_typeof(selected) <> 'string'
              or not exists (
                select 1
                from jsonb_array_elements_text(
                  coalesce(question -> 'options', '[]'::jsonb)
                ) as options(option)
                where option = selected #>> '{}'
              )
          )
        then
          raise exception 'Invalid multiple choice answer';
        end if;
      else
        raise exception 'Unsupported questionnaire type';
      end if;
    end loop;
  else
    -- 未启用问卷时丢弃客户端额外提交的答卷。
    p_answers := '{}'::jsonb;
  end if;

  -- 同一活动与邮箱保持幂等；匿名重复提交不能读取或改写原预约。
  insert into public.subscribers (
    campaign_id,
    email,
    answers,
    visitor_hash,
    session_hash
  )
  values (
    target_campaign_id,
    lower(trim(p_email))::extensions.citext,
    coalesce(p_answers, '{}'::jsonb),
    case
      when p_visitor_id is null then null
      else encode(extensions.digest(p_visitor_id, 'sha256'), 'hex')
    end,
    case
      when p_session_id is null then null
      else encode(extensions.digest(p_session_id, 'sha256'), 'hex')
    end
  )
  on conflict (campaign_id, email)
  do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

drop function if exists public.track_campaign_page_view(
  text, text, text, text, text, text, text, text, text
);
drop function if exists public.track_campaign_page_view(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
);

create function public.track_campaign_page_view(
  p_slug text,
  p_view_id text,
  p_visitor_id text,
  p_session_id text,
  p_referrer_host text default null,
  p_source text default null,
  p_medium text default null,
  p_campaign text default null,
  p_device_type text default 'unknown',
  p_locale text default null,
  p_timezone text default null,
  p_country_code text default null,
  p_region text default null,
  p_city text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_campaign_id uuid;
  inserted_count integer;
begin
  if p_slug is null
    or p_view_id is null
    or p_visitor_id is null
    or p_session_id is null
    or p_device_type is null
    or p_slug !~ '^[a-z0-9-]+$'
    or char_length(p_slug) > 80
    or p_view_id !~ '^[A-Za-z0-9_-]{16,128}$'
    or p_visitor_id !~ '^[A-Za-z0-9_-]{16,128}$'
    or p_session_id !~ '^[A-Za-z0-9_-]{16,128}$'
    or char_length(coalesce(p_referrer_host, '')) > 253
    or char_length(coalesce(p_source, '')) > 80
    or char_length(coalesce(p_medium, '')) > 80
    or char_length(coalesce(p_campaign, '')) > 120
    or char_length(coalesce(p_locale, '')) > 35
    or char_length(coalesce(p_timezone, '')) > 64
    or char_length(coalesce(p_region, '')) > 120
    or char_length(coalesce(p_city, '')) > 120
    or (
      nullif(trim(p_country_code), '') is not null
      and upper(trim(p_country_code)) !~ '^[A-Z]{2}$'
    )
    or p_device_type not in ('desktop', 'mobile', 'tablet', 'unknown')
  then
    raise exception 'Invalid page view payload';
  end if;

  select campaign.id
  into target_campaign_id
  from public.subscription_campaigns as campaign
  where campaign.slug = p_slug
    and campaign.status = 'published'
    and campaign.published_config is not null;

  if target_campaign_id is null then
    return false;
  end if;

  insert into public.campaign_page_views (
    campaign_id,
    view_hash,
    visitor_hash,
    session_hash,
    referrer_host,
    source,
    medium,
    campaign_tag,
    device_type,
    locale,
    timezone,
    country_code,
    region,
    city
  )
  values (
    target_campaign_id,
    encode(extensions.digest(p_view_id, 'sha256'), 'hex'),
    encode(extensions.digest(p_visitor_id, 'sha256'), 'hex'),
    encode(extensions.digest(p_session_id, 'sha256'), 'hex'),
    nullif(lower(trim(p_referrer_host)), ''),
    left(
      coalesce(
        nullif(lower(trim(p_source)), ''),
        nullif(lower(trim(p_referrer_host)), ''),
        'direct'
      ),
      80
    ),
    nullif(lower(trim(p_medium)), ''),
    nullif(trim(p_campaign), ''),
    p_device_type,
    nullif(trim(p_locale), ''),
    nullif(trim(p_timezone), ''),
    nullif(upper(trim(p_country_code)), ''),
    nullif(trim(p_region), ''),
    nullif(trim(p_city), '')
  )
  on conflict (campaign_id, view_hash) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count > 0;
end;
$$;

create or replace function public.track_campaign_page_engagement(
  p_slug text,
  p_view_id text,
  p_duration_seconds integer,
  p_max_scroll_depth integer,
  p_interaction_count integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  if p_slug is null
    or p_view_id is null
    or p_slug !~ '^[a-z0-9-]+$'
    or char_length(p_slug) > 80
    or p_view_id !~ '^[A-Za-z0-9_-]{16,128}$'
    or p_duration_seconds not between 0 and 86400
    or p_max_scroll_depth not between 0 and 100
    or p_interaction_count not between 0 and 10000
  then
    raise exception 'Invalid engagement payload';
  end if;

  update public.campaign_page_views as view
  set
    duration_seconds = greatest(view.duration_seconds, p_duration_seconds),
    max_scroll_depth = greatest(view.max_scroll_depth, p_max_scroll_depth),
    interaction_count = greatest(view.interaction_count, p_interaction_count)
  from public.subscription_campaigns as campaign
  where campaign.id = view.campaign_id
    and campaign.slug = p_slug
    and campaign.status = 'published'
    and view.view_hash = encode(extensions.digest(p_view_id, 'sha256'), 'hex');

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

drop function if exists public.get_workspace_analytics(integer);

create or replace function public.get_campaign_analytics(
  p_campaign_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
  safe_days integer;
  period_start date;
  result jsonb;
begin
  if target_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.subscription_campaigns as campaign
    where campaign.id = p_campaign_id
      and campaign.user_id = target_user_id
      and campaign.status = 'published'
      and campaign.published_config is not null
  ) then
    raise exception 'Published campaign not found' using errcode = '42501';
  end if;

  safe_days := least(365, greatest(7, coalesce(p_days, 30)));
  period_start := current_date - (safe_days - 1);

  with
  owned_campaigns as materialized (
    select
      campaign.id,
      campaign.name,
      campaign.slug,
      campaign.published_config
    from public.subscription_campaigns as campaign
    where campaign.user_id = target_user_id
      and campaign.id = p_campaign_id
      and campaign.status = 'published'
      and campaign.published_config is not null
  ),
  period_views as materialized (
    select view.*
    from public.campaign_page_views as view
    join owned_campaigns as campaign on campaign.id = view.campaign_id
    where view.viewed_at >= period_start::timestamptz
  ),
  all_views as materialized (
    select view.*
    from public.campaign_page_views as view
    join owned_campaigns as campaign on campaign.id = view.campaign_id
  ),
  period_subscribers as materialized (
    select subscriber.*
    from public.subscribers as subscriber
    join owned_campaigns as campaign on campaign.id = subscriber.campaign_id
    where subscriber.created_at >= period_start::timestamptz
  ),
  all_subscribers as materialized (
    select subscriber.*
    from public.subscribers as subscriber
    join owned_campaigns as campaign on campaign.id = subscriber.campaign_id
  ),
  calendar as (
    select day::date as day
    from generate_series(period_start, current_date, interval '1 day') as days(day)
  ),
  view_daily as (
    select
      viewed_at::date as day,
      count(*) as page_views,
      count(distinct visitor_hash) as unique_visitors
    from period_views
    group by viewed_at::date
  ),
  subscriber_daily as (
    select created_at::date as day, count(*) as applications
    from period_subscribers
    group by created_at::date
  ),
  daily_data as (
    select
      calendar.day,
      coalesce(view_daily.page_views, 0) as page_views,
      coalesce(view_daily.unique_visitors, 0) as unique_visitors,
      coalesce(subscriber_daily.applications, 0) as applications
    from calendar
    left join view_daily on view_daily.day = calendar.day
    left join subscriber_daily on subscriber_daily.day = calendar.day
  ),
  campaign_view_stats as (
    select
      campaign_id,
      count(*) as page_views,
      count(distinct visitor_hash) as unique_visitors,
      count(distinct session_hash) as sessions
    from period_views
    group by campaign_id
  ),
  campaign_subscriber_stats as (
    select campaign_id, count(*) as applications
    from period_subscribers
    group by campaign_id
  ),
  campaign_all_subscriber_stats as (
    select campaign_id, count(*) as total_applications
    from all_subscribers
    group by campaign_id
  ),
  campaign_data as (
    select
      campaign.id,
      campaign.name,
      campaign.slug,
      coalesce(view_stats.page_views, 0) as page_views,
      coalesce(view_stats.unique_visitors, 0) as unique_visitors,
      coalesce(view_stats.sessions, 0) as sessions,
      coalesce(subscriber_stats.applications, 0) as applications,
      coalesce(all_subscriber_stats.total_applications, 0) as total_applications,
      case
        when coalesce(view_stats.unique_visitors, 0) = 0 then 0
        else round(
          coalesce(subscriber_stats.applications, 0)::numeric
          / view_stats.unique_visitors::numeric * 100,
          1
        )
      end as conversion_rate
    from owned_campaigns as campaign
    left join campaign_view_stats as view_stats on view_stats.campaign_id = campaign.id
    left join campaign_subscriber_stats as subscriber_stats
      on subscriber_stats.campaign_id = campaign.id
    left join campaign_all_subscriber_stats as all_subscriber_stats
      on all_subscriber_stats.campaign_id = campaign.id
  ),
  source_data as (
    select
      source as label,
      count(*) as page_views,
      count(distinct visitor_hash) as unique_visitors
    from period_views
    group by source
  ),
  device_data as (
    select
      device_type as label,
      count(*) as page_views,
      count(distinct visitor_hash) as unique_visitors
    from period_views
    group by device_type
  ),
  domain_data as (
    select
      lower(split_part(email::text, '@', 2)) as label,
      count(*) as applications
    from period_subscribers
    group by lower(split_part(email::text, '@', 2))
  ),
  question_data as (
    select
      campaign.id as campaign_id,
      campaign.name as campaign_name,
      question.item ->> 'id' as question_id,
      question.item ->> 'label' as label,
      question.item ->> 'type' as question_type,
      coalesce((question.item ->> 'required')::boolean, false) as required,
      question.item as question
    from owned_campaigns as campaign
    cross join lateral jsonb_array_elements(
      coalesce(campaign.published_config #> '{questionnaire,questions}', '[]'::jsonb)
    ) as question(item)
    where coalesce(campaign.published_config #>> '{questionnaire,enabled}', 'false') = 'true'
  ),
  question_response_data as materialized (
    select
      question.*,
      subscriber.id as subscriber_id,
      subscriber.answers -> question.question_id as answer
    from question_data as question
    left join period_subscribers as subscriber
      on subscriber.campaign_id = question.campaign_id
  ),
  question_stats as (
    select
      campaign_id,
      campaign_name,
      question_id,
      label,
      question_type,
      required,
      count(subscriber_id) as total_applications,
      count(subscriber_id) filter (
        where answer is not null
          and answer <> 'null'::jsonb
          and case
            when jsonb_typeof(answer) = 'string'
              then char_length(trim(answer #>> '{}')) > 0
            else true
          end
          and case
            when jsonb_typeof(answer) = 'array'
              then jsonb_array_length(answer) > 0
            else true
          end
      ) as responses
    from question_response_data
    group by campaign_id, campaign_name, question_id, label, question_type, required
  ),
  configured_options as (
    select
      question.campaign_id,
      question.question_id,
      option.value as label,
      option.ordinality as option_index
    from question_data as question
    cross join lateral jsonb_array_elements_text(
      coalesce(question.question -> 'options', '[]'::jsonb)
    ) with ordinality as option(value, ordinality)
  ),
  selected_options as (
    select
      response.campaign_id,
      response.question_id,
      selection.value as label
    from question_response_data as response
    cross join lateral (
      select item as value
      from jsonb_array_elements_text(
        case
          when jsonb_typeof(response.answer) = 'array' then response.answer
          else '[]'::jsonb
        end
      ) as selections(item)
      union all
      select response.answer #>> '{}'
      where jsonb_typeof(response.answer) = 'string'
    ) as selection
  ),
  question_option_counts as (
    select
      option.campaign_id,
      option.question_id,
      option.label,
      option.option_index,
      count(selection.label) as selections
    from configured_options as option
    left join selected_options as selection
      on selection.campaign_id = option.campaign_id
      and selection.question_id = option.question_id
      and selection.label = option.label
    group by option.campaign_id, option.question_id, option.label, option.option_index
  ),
  question_options as (
    select
      campaign_id,
      question_id,
      jsonb_agg(
        jsonb_build_object('label', label, 'selections', selections)
        order by option_index
      ) as options
    from question_option_counts
    group by campaign_id, question_id
  ),
  question_summary as (
    select
      stats.*,
      coalesce(options.options, '[]'::jsonb) as options
    from question_stats as stats
    left join question_options as options
      on options.campaign_id = stats.campaign_id
      and options.question_id = stats.question_id
  ),
  returning_visitors as (
    select visitor_hash
    from period_views
    group by visitor_hash
    having count(distinct session_hash) > 1
  )
  select jsonb_build_object(
    'rangeDays', safe_days,
    'periodStart', period_start::text,
    'totals', jsonb_build_object(
      'publishedCampaigns', (select count(*) from owned_campaigns),
      'pageViews', (select count(*) from period_views),
      'uniqueVisitors', (select count(distinct visitor_hash) from period_views),
      'sessions', (select count(distinct session_hash) from period_views),
      'applications', (select count(*) from period_subscribers),
      'conversionRate', case
        when (select count(distinct visitor_hash) from period_views) = 0 then 0
        else round(
          (select count(*) from period_subscribers)::numeric
          / (select count(distinct visitor_hash) from period_views)::numeric * 100,
          1
        )
      end,
      'returningVisitorRate', case
        when (select count(distinct visitor_hash) from period_views) = 0 then 0
        else round(
          (select count(*) from returning_visitors)::numeric
          / (select count(distinct visitor_hash) from period_views)::numeric * 100,
          1
        )
      end,
      'pageViewsPerVisitor', case
        when (select count(distinct visitor_hash) from period_views) = 0 then 0
        else round(
          (select count(*) from period_views)::numeric
          / (select count(distinct visitor_hash) from period_views)::numeric,
          2
        )
      end,
      'allTimePageViews', (select count(*) from all_views),
      'allTimeUniqueVisitors', (select count(distinct visitor_hash) from all_views),
      'allTimeApplications', (select count(*) from all_subscribers)
    ),
    'daily', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', day::text,
          'pageViews', page_views,
          'uniqueVisitors', unique_visitors,
          'applications', applications
        ) order by day
      )
      from daily_data
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'slug', slug,
          'pageViews', page_views,
          'uniqueVisitors', unique_visitors,
          'sessions', sessions,
          'applications', applications,
          'totalApplications', total_applications,
          'conversionRate', conversion_rate
        ) order by applications desc, unique_visitors desc, name
      )
      from campaign_data
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'label', label,
          'pageViews', page_views,
          'uniqueVisitors', unique_visitors
        ) order by page_views desc, label
      )
      from (select * from source_data order by page_views desc limit 12) as top_sources
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'label', label,
          'pageViews', page_views,
          'uniqueVisitors', unique_visitors
        ) order by page_views desc, label
      )
      from device_data
    ), '[]'::jsonb),
    'emailDomains', coalesce((
      select jsonb_agg(
        jsonb_build_object('label', label, 'applications', applications)
        order by applications desc, label
      )
      from (select * from domain_data order by applications desc limit 12) as top_domains
    ), '[]'::jsonb),
    'questionInsights', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'campaignId', campaign_id,
          'campaignName', campaign_name,
          'questionId', question_id,
          'label', label,
          'type', question_type,
          'required', required,
          'totalApplications', total_applications,
          'responses', responses,
          'options', options
        ) order by campaign_name, label
      )
      from question_summary
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.get_campaign_subscribers_with_analytics(
  p_campaign_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
  result jsonb;
begin
  if target_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.subscription_campaigns as campaign
    where campaign.id = p_campaign_id
      and campaign.user_id = target_user_id
      and campaign.status = 'published'
  ) then
    raise exception 'Campaign not found' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', subscriber.id,
        'campaign_id', subscriber.campaign_id,
        'email', subscriber.email::text,
        'answers', subscriber.answers,
        'created_at', subscriber.created_at,
        'analytics', case
          when coalesce(stats.page_views, 0) = 0 then null
          else jsonb_build_object(
            'source', coalesce(latest.source, 'direct'),
            'medium', latest.medium,
            'campaignTag', latest.campaign_tag,
            'deviceType', coalesce(latest.device_type, 'unknown'),
            'locale', latest.locale,
            'timezone', latest.timezone,
            'countryCode', latest.country_code,
            'region', latest.region,
            'city', latest.city,
            'pageViews', stats.page_views,
            'sessions', stats.sessions,
            'engagementSeconds', stats.engagement_seconds,
            'maxScrollDepth', stats.max_scroll_depth,
            'interactionCount', stats.interaction_count,
            'firstSeenAt', stats.first_seen_at,
            'lastSeenAt', stats.last_seen_at
          )
        end
      )
      order by subscriber.created_at desc
    ),
    '[]'::jsonb
  )
  into result
  from public.subscribers as subscriber
  left join lateral (
    select
      count(*) as page_views,
      count(distinct view.session_hash) as sessions,
      coalesce(sum(view.duration_seconds), 0) as engagement_seconds,
      coalesce(max(view.max_scroll_depth), 0) as max_scroll_depth,
      coalesce(sum(view.interaction_count), 0) as interaction_count,
      min(view.viewed_at) as first_seen_at,
      max(view.viewed_at) as last_seen_at
    from public.campaign_page_views as view
    where view.campaign_id = subscriber.campaign_id
      and subscriber.visitor_hash is not null
      and view.visitor_hash = subscriber.visitor_hash
  ) as stats on true
  left join lateral (
    select
      view.source,
      view.medium,
      view.campaign_tag,
      view.device_type,
      view.locale,
      view.timezone,
      view.country_code,
      view.region,
      view.city
    from public.campaign_page_views as view
    where view.campaign_id = subscriber.campaign_id
      and (
        (
          subscriber.session_hash is not null
          and view.session_hash = subscriber.session_hash
        )
        or (
          subscriber.session_hash is null
          and subscriber.visitor_hash is not null
          and view.visitor_hash = subscriber.visitor_hash
        )
      )
    order by view.viewed_at desc
    limit 1
  ) as latest on true
  where subscriber.campaign_id = p_campaign_id;

  return result;
end;
$$;

drop function if exists public.get_workspace_behavior_analytics(integer);

create or replace function public.get_campaign_behavior_analytics(
  p_campaign_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_user_id uuid := auth.uid();
  safe_days integer;
  period_start date;
  result jsonb;
begin
  if target_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.subscription_campaigns as campaign
    where campaign.id = p_campaign_id
      and campaign.user_id = target_user_id
      and campaign.status = 'published'
      and campaign.published_config is not null
  ) then
    raise exception 'Published campaign not found' using errcode = '42501';
  end if;

  safe_days := least(365, greatest(7, coalesce(p_days, 30)));
  period_start := current_date - (safe_days - 1);

  with
  owned_campaigns as materialized (
    select campaign.id
    from public.subscription_campaigns as campaign
    where campaign.user_id = target_user_id
      and campaign.id = p_campaign_id
      and campaign.status = 'published'
  ),
  period_views as materialized (
    select view.*
    from public.campaign_page_views as view
    join owned_campaigns as campaign on campaign.id = view.campaign_id
    where view.viewed_at >= period_start::timestamptz
  ),
  campaign_engagement as (
    select
      campaign_id,
      round(coalesce(avg(duration_seconds), 0)::numeric, 1) as average_duration_seconds,
      round(coalesce(avg(max_scroll_depth), 0)::numeric, 1) as average_scroll_depth
    from period_views
    group by campaign_id
  ),
  source_engagement as (
    select
      source as label,
      round(coalesce(avg(duration_seconds), 0)::numeric, 1) as average_duration_seconds,
      round(coalesce(avg(max_scroll_depth), 0)::numeric, 1) as average_scroll_depth
    from period_views
    group by source
  ),
  device_engagement as (
    select
      device_type as label,
      round(coalesce(avg(duration_seconds), 0)::numeric, 1) as average_duration_seconds,
      round(coalesce(avg(max_scroll_depth), 0)::numeric, 1) as average_scroll_depth
    from period_views
    group by device_type
  ),
  location_data as (
    select
      country_code,
      region,
      city,
      count(*) as page_views,
      count(distinct visitor_hash) as unique_visitors,
      round(coalesce(avg(duration_seconds), 0)::numeric, 1) as average_duration_seconds
    from period_views
    group by country_code, region, city
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'averageDurationSeconds',
        round(coalesce((select avg(duration_seconds) from period_views), 0)::numeric, 1),
      'averageScrollDepth',
        round(coalesce((select avg(max_scroll_depth) from period_views), 0)::numeric, 1),
      'averageInteractions',
        round(coalesce((select avg(interaction_count) from period_views), 0)::numeric, 1),
      'engagedViewRate', case
        when (select count(*) from period_views) = 0 then 0
        else round(
          (
            select count(*)
            from period_views
            where duration_seconds >= 10
              or max_scroll_depth >= 50
              or interaction_count > 0
          )::numeric
          / (select count(*) from period_views)::numeric * 100,
          1
        )
      end
    ),
    'campaigns', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', campaign_id,
          'averageDurationSeconds', average_duration_seconds,
          'averageScrollDepth', average_scroll_depth
        )
      )
      from campaign_engagement
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'label', label,
          'averageDurationSeconds', average_duration_seconds,
          'averageScrollDepth', average_scroll_depth
        )
      )
      from source_engagement
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'label', label,
          'averageDurationSeconds', average_duration_seconds,
          'averageScrollDepth', average_scroll_depth
        )
      )
      from device_engagement
    ), '[]'::jsonb),
    'locations', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'countryCode', country_code,
          'region', region,
          'city', city,
          'pageViews', page_views,
          'uniqueVisitors', unique_visitors,
          'averageDurationSeconds', average_duration_seconds
        )
        order by page_views desc, country_code, region, city
      )
      from (
        select *
        from location_data
        order by page_views desc
        limit 12
      ) as top_locations
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

comment on function public.get_campaigns_with_counts() is
  '返回当前用户可见的活动及预约数量';
comment on function public.get_published_campaign(text) is
  '按 slug 读取公开活动的已发布快照';
comment on function public.subscribe_to_campaign(text, text, jsonb, text, text) is
  '校验常用邮箱与发布问卷，并关联匿名访客和转化会话';
comment on function public.track_campaign_page_view(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
) is '匿名记录公开页 PV、粗粒度地域与浏览环境';
comment on function public.track_campaign_page_engagement(
  text, text, integer, integer, integer
) is '按匿名页面访问更新停留时长、滚动深度与交互次数';
comment on function public.get_campaign_analytics(uuid, integer) is
  '按当前用户指定活动汇总访问、来源、设备、转化、邮箱域名与问卷回答分布';
comment on function public.get_campaign_behavior_analytics(uuid, integer) is
  '按当前用户指定活动汇总公开页行为参与度与粗粒度地域分布';
comment on function public.get_campaign_subscribers_with_analytics(uuid) is
  '返回当前用户指定活动的预约记录及匿名访问画像';

create or replace function public.can_manage_campaign_media(p_campaign_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  parsed_campaign_id uuid;
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  begin
    parsed_campaign_id := p_campaign_id::uuid;
  exception
    when invalid_text_representation then
      return false;
  end;

  return exists (
    select 1
    from public.subscription_campaigns as campaign
    where campaign.id = parsed_campaign_id
      and campaign.user_id = (select auth.uid())
  );
end;
$$;

comment on function public.can_manage_campaign_media(text) is
  '校验当前登录用户是否拥有指定活动，用于 Storage 媒体路径策略';

create or replace function public.prevent_closed_campaign_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.subscription_campaigns as campaign
    where campaign.id = new.campaign_id
      and coalesce((campaign.published_config #>> '{sectionVisibility,signup}')::boolean, true)
        = false
  ) then
    raise exception 'Campaign subscription is closed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_closed_campaign_subscription on public.subscribers;
create trigger prevent_closed_campaign_subscription
before insert or update on public.subscribers
for each row
execute function public.prevent_closed_campaign_subscription();

comment on function public.prevent_closed_campaign_subscription() is
  '阻止对已关闭预约入口的发布活动写入预约记录';

-- 最小权限：匿名用户只能执行三个公开 RPC，不能直接读写业务表。
revoke all on function public.get_published_campaign(text) from public;
revoke all on function public.subscribe_to_campaign(text, text, jsonb, text, text) from public;
revoke all on function public.track_campaign_page_view(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public;
revoke all on function public.track_campaign_page_engagement(
  text, text, integer, integer, integer
) from public;
revoke all on function public.get_campaigns_with_counts() from public;
revoke all on function public.get_campaign_analytics(uuid, integer) from public;
revoke all on function public.get_campaign_behavior_analytics(uuid, integer) from public;
revoke all on function public.get_campaign_subscribers_with_analytics(uuid) from public;
revoke all on function public.can_manage_campaign_media(text) from public;
revoke all on function public.prevent_closed_campaign_subscription() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.set_updated_at() from public;
revoke all on public.users from anon, authenticated;
revoke all on public.subscription_campaigns from anon, authenticated;
revoke all on public.subscribers from anon, authenticated;
revoke all on public.campaign_page_views from anon, authenticated;

grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.subscription_campaigns to authenticated;
grant select, delete on public.subscribers to authenticated;
grant select on public.campaign_page_views to authenticated;
grant execute on function public.get_published_campaign(text) to anon, authenticated;
grant execute on function public.subscribe_to_campaign(
  text, text, jsonb, text, text
) to anon, authenticated;
grant execute on function public.track_campaign_page_view(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
) to anon, authenticated;
grant execute on function public.track_campaign_page_engagement(
  text, text, integer, integer, integer
) to anon, authenticated;
grant execute on function public.get_campaigns_with_counts() to authenticated;
grant execute on function public.get_campaign_analytics(uuid, integer) to authenticated;
grant execute on function public.get_campaign_behavior_analytics(uuid, integer) to authenticated;
grant execute on function public.get_campaign_subscribers_with_analytics(uuid) to authenticated;
grant execute on function public.can_manage_campaign_media(text) to authenticated;

-- =============================================================================
-- 7. 活动媒体 Storage
-- =============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'campaign-media',
  'campaign-media',
  true,
  104857600,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read campaign media" on storage.objects;

-- Public buckets serve known object URLs without a SELECT policy. Restrict metadata listing
-- to owners so draft and abandoned media paths cannot be enumerated anonymously.
drop policy if exists "Owners can read campaign media" on storage.objects;
create policy "Owners can read campaign media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'campaign-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Owners can upload campaign media" on storage.objects;
create policy "Owners can upload campaign media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'campaign-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_campaign_media((storage.foldername(name))[2])
);

drop policy if exists "Owners can update campaign media" on storage.objects;
create policy "Owners can update campaign media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'campaign-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'campaign-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_campaign_media((storage.foldername(name))[2])
);

drop policy if exists "Owners can delete campaign media" on storage.objects;
create policy "Owners can delete campaign media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'campaign-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.can_manage_campaign_media((storage.foldername(name))[2])
);

commit;

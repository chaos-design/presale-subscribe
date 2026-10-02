-- 适用范围：
-- - 已经执行过旧版 platform.sql 的现有 Supabase 项目。
-- - 已经执行过当前 platform.sql 的项目可以安全重复执行本文件，不会产生差异。
-- - 新项目请直接执行 supabase/platform.sql，不需要再执行本文件。
--
-- 本次变更：
-- 1. 让匿名预约保持幂等且不暴露邮箱是否已预约。
-- 2. 当发布快照关闭预约区时，阻止匿名预约写入。
-- 3. 校准 campaign-media bucket 与按用户、活动归属隔离的 Storage 策略。
-- 4. 阻止匿名用户列举媒体对象元数据。
-- 5. 使用 security definer helper 稳定执行 Storage 路径中的活动归属校验。
-- 6. 用与 platform.sql 一致的自包含实现替换按项目分析 RPC，并移除已废弃的
--    get_workspace_analytics 与 get_workspace_behavior_analytics。
--
-- 本脚本可重复执行，不修改现有活动、订阅者或媒体对象数据。

begin;

do $$
begin
  if to_regclass('public.subscription_campaigns') is null
    or to_regclass('public.subscribers') is null
  then
    raise exception
      'Base schema is missing. Run supabase/platform.sql instead.';
  end if;
end;
$$;

drop function if exists public.subscribe_to_campaign(text, text);
drop function if exists public.subscribe_to_campaign(text, text, jsonb);

create or replace function public.subscribe_to_campaign(
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

  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object'
    or pg_column_size(coalesce(p_answers, '{}'::jsonb)) > 16384
  then
    raise exception 'Invalid questionnaire answers';
  end if;

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
    p_answers := '{}'::jsonb;
  end if;

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

revoke all on function public.subscribe_to_campaign(
  text, text, jsonb, text, text
) from public;
grant execute on function public.subscribe_to_campaign(
  text, text, jsonb, text, text
) to anon, authenticated;

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

revoke all on function public.prevent_closed_campaign_subscription() from public;

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

revoke all on function public.can_manage_campaign_media(text) from public;
grant execute on function public.can_manage_campaign_media(text) to authenticated;

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
  period_views as materialized (
    select view.*
    from public.campaign_page_views as view
    where view.campaign_id = p_campaign_id
      and view.viewed_at >= period_start::timestamptz
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
  ) into result;

  return result;
end;
$$;

comment on function public.get_campaign_analytics(uuid, integer) is
  '按当前用户指定活动汇总访问、来源、设备、转化、邮箱域名与问卷回答分布';
comment on function public.get_campaign_behavior_analytics(uuid, integer) is
  '按当前用户指定活动汇总公开页行为参与度与粗粒度地域分布';

revoke all on function public.get_campaign_analytics(uuid, integer) from public;
revoke all on function public.get_campaign_behavior_analytics(uuid, integer) from public;
grant execute on function public.get_campaign_analytics(uuid, integer) to authenticated;
grant execute on function public.get_campaign_behavior_analytics(uuid, integer) to authenticated;

commit;

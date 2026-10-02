import { readFileSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { citext } from "@electric-sql/pglite/contrib/citext"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { beforeAll, describe, expect, it } from "vitest"

const readSql = (name: string) => readFileSync(join(process.cwd(), "supabase", name), "utf8")

// PGlite runs a real PostgreSQL instance in-process, so these tests execute the exact SQL
// operators run in the Supabase SQL Editor. Only the Supabase-managed objects are stubbed:
// the auth schema used by RLS and the storage schema used by media policies.
const supabaseStubs = `
  create schema if not exists extensions;
  create schema if not exists auth;
  create schema if not exists storage;
  create role anon nologin;
  create role authenticated nologin;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text not null
  );
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select string_to_array(name, '/')
  $$;
`

const ownerA = "11111111-1111-4111-8111-111111111111"
const ownerB = "22222222-2222-4222-8222-222222222222"
const campaignId = "33333333-3333-4333-8333-333333333333"
const draftCampaignId = "33333333-3333-4333-8333-3333333333ff"
const viewId = "abcdefghijklmnopqrst"
const visitorId = "visitoridentifier01"
const sessionId = "sessionidentifier01"

const publishedConfig = {
  sectionVisibility: { signup: true },
  questionnaire: {
    enabled: true,
    questions: [
      { id: "role", type: "single_choice", required: true, options: ["dev", "pm"] },
      { id: "note", type: "short_text", required: false },
    ],
  },
}
const draftConfig = { sectionVisibility: { signup: true }, questionnaire: { enabled: false } }
const closedConfig = { sectionVisibility: { signup: false }, questionnaire: { enabled: false } }

const businessTables = ["users", "subscription_campaigns", "subscribers", "campaign_page_views"]
const tablePrivileges = ["SELECT", "INSERT", "UPDATE", "DELETE"]
const authenticatedPrivileges: Record<string, string[]> = {
  users: ["SELECT", "UPDATE"],
  subscription_campaigns: ["SELECT", "INSERT", "UPDATE", "DELETE"],
  subscribers: ["SELECT", "DELETE"],
  campaign_page_views: ["SELECT"],
}

// Contract per public-schema function: who may execute it and whether it runs as the owner.
// Only anonymous entry points need SECURITY DEFINER; the dashboard campaign list stays
// SECURITY INVOKER so row level security applies to the caller.
const rpcContract = [
  { name: "get_published_campaign", anonymous: true, definer: true },
  { name: "subscribe_to_campaign", anonymous: true, definer: true },
  { name: "track_campaign_page_view", anonymous: true, definer: true },
  { name: "track_campaign_page_engagement", anonymous: true, definer: true },
  { name: "can_manage_campaign_media", anonymous: false, definer: true },
  { name: "get_campaign_analytics", anonymous: false, definer: true },
  { name: "get_campaign_behavior_analytics", anonymous: false, definer: true },
  { name: "get_campaign_subscribers_with_analytics", anonymous: false, definer: true },
  { name: "get_campaigns_with_counts", anonymous: false, definer: false },
] as const

const internalFunctions = [
  "set_updated_at",
  "handle_new_user",
  "prevent_closed_campaign_subscription",
] as const

interface TableRow {
  relname: string
  relrowsecurity: boolean
}
interface PrivilegeRow {
  granted: boolean
}
interface FunctionRow {
  proname: string
  arguments: string
  security_definer: boolean
  proconfig: string[] | null
  anon_execute: boolean
  authenticated_execute: boolean
}
interface BucketRow {
  id: string
  public: boolean
  file_size_limit: string | number
  allowed_mime_types: string[]
}
interface PolicyRow {
  policyname: string
}
interface CountRow {
  count: number
}
interface SubscriberRow {
  email: string
}
interface PageViewRow {
  visitor_hash: string
  hash_length: number
  source: string
  device_type: string
  duration_seconds: number
  max_scroll_depth: number
  interaction_count: number
}
interface AnalyticsRow {
  data: { totals: { pageViews: number; applications: number; averageDurationSeconds: number } }
}
interface SubscriberListRow {
  data: unknown[]
}
interface CampaignRow {
  id: string
  user_id: string
}

let db: PGlite

async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await db.query<T>(sql, params)
  return result.rows
}

async function fingerprint() {
  const [functions, policies, columns, rowSecurity, indexes, buckets, triggers] = await Promise.all(
    [
      queryAll<FunctionRow>(`
      select p.proname,
             pg_get_function_identity_arguments(p.oid) as arguments,
             p.prosecdef as security_definer,
             p.proconfig,
             has_function_privilege('anon', p.oid, 'execute') as anon_execute,
             has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' order by p.proname, arguments`),
      queryAll<PolicyRow & Record<string, unknown>>(`
      select policyname, schemaname, tablename, roles::text, qual, with_check
        from pg_policies order by schemaname, tablename, policyname`),
      queryAll<Record<string, unknown>>(`
      select table_name, column_name, data_type, is_nullable,
             column_default is not null as has_default
        from information_schema.columns where table_schema = 'public'
       order by table_name, ordinal_position`),
      queryAll<TableRow>(`
      select relname, relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`),
      queryAll<Record<string, unknown>>(
        `select indexname, indexdef from pg_indexes where schemaname = 'public' order by indexname`
      ),
      queryAll<BucketRow>(
        `select id, name, public, file_size_limit, allowed_mime_types from storage.buckets order by id`
      ),
      queryAll<Record<string, unknown>>(`
      select event_object_table, trigger_name, action_timing from information_schema.triggers
       where trigger_schema = 'public' order by trigger_name`),
    ]
  )

  return JSON.stringify({ functions, policies, columns, rowSecurity, indexes, buckets, triggers })
}

async function allowed(statement: string) {
  return db
    .query(statement)
    .then(() => true)
    .catch(() => false)
}

async function asRole(role: "anon" | "authenticated", userId: string | null, statement: string) {
  await db.exec(`set role ${role}`)
  if (userId) {
    await db.exec(`set request.jwt.claim.sub = '${userId}'`)
  }
  const result = await allowed(statement)
  await db.exec("reset role")
  return result
}

async function setPublishedConfig(config: Record<string, unknown>) {
  await db.query(
    `update public.subscription_campaigns set published_config = $1::jsonb where id = $2`,
    [JSON.stringify(config), campaignId]
  )
}

beforeAll(async () => {
  db = await PGlite.create({ extensions: { citext, pgcrypto } })
  await db.exec(supabaseStubs)
  await db.exec(readSql("platform.sql"))
}, 120_000)

describe("supabase/platform.sql", () => {
  it("applies twice without failing", async () => {
    await expect(db.exec(readSql("platform.sql"))).resolves.toBeTruthy()
  }, 60_000)

  it("creates the business tables with row level security enabled", async () => {
    const rows = await queryAll<TableRow>(`
      select relname, relrowsecurity from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r'`)

    for (const table of businessTables) {
      const row = rows.find((entry) => entry.relname === table)
      expect(row, `missing table ${table}`).toBeDefined()
      expect(row?.relrowsecurity, `RLS disabled on ${table}`).toBe(true)
    }
  })

  it("grants the anonymous role no direct table access", async () => {
    for (const table of businessTables) {
      for (const privilege of tablePrivileges) {
        const [row] = await queryAll<PrivilegeRow>(
          `select has_table_privilege('anon', 'public.${table}', '${privilege}') as granted`
        )
        expect(row?.granted, `anon can ${privilege} on ${table}`).toBe(false)
      }
    }
  })

  it("grants owners exactly the table privileges the dashboard needs", async () => {
    for (const [table, expected] of Object.entries(authenticatedPrivileges)) {
      for (const privilege of tablePrivileges) {
        const [row] = await queryAll<PrivilegeRow>(
          `select has_table_privilege('authenticated', 'public.${table}', '${privilege}') as granted`
        )
        expect(row?.granted, `authenticated ${privilege} on ${table}`).toBe(
          expected.includes(privilege)
        )
      }
    }
  })

  it("matches the documented RPC contract", async () => {
    const rows = await queryAll<FunctionRow>(`
      select p.proname,
             pg_get_function_identity_arguments(p.oid) as arguments,
             p.prosecdef as security_definer,
             p.proconfig,
             has_function_privilege('anon', p.oid, 'execute') as anon_execute,
             has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'`)

    for (const contract of rpcContract) {
      const row = rows.find((entry) => entry.proname === contract.name)
      expect(row, `missing rpc ${contract.name}`).toBeDefined()
      expect(
        row?.security_definer,
        `${contract.name} must be security ${contract.definer ? "definer" : "invoker"}`
      ).toBe(contract.definer)
      expect(row?.proconfig, `${contract.name} must pin search_path`).not.toBeNull()
      expect(row?.anon_execute, `${contract.name} anonymous access`).toBe(contract.anonymous)
      expect(row?.authenticated_execute, `${contract.name} owner access`).toBe(true)
    }

    for (const name of internalFunctions) {
      const row = rows.find((entry) => entry.proname === name)
      expect(row, `missing helper ${name}`).toBeDefined()
      expect(row?.anon_execute, `${name} must not be callable by anon`).toBe(false)
      expect(row?.authenticated_execute, `${name} must not be callable by owners`).toBe(false)
    }

    expect(rows.map((entry) => entry.proname)).not.toContain("get_workspace_analytics")
    expect(rows.map((entry) => entry.proname)).not.toContain("get_workspace_behavior_analytics")
  })

  it("creates the public media bucket with a size and mime-type policy", async () => {
    const rows = await queryAll<BucketRow>(
      `select * from storage.buckets where id = 'campaign-media'`
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]?.public).toBe(true)
    expect(String(rows[0]?.file_size_limit)).toBe("104857600")
    expect(rows[0]?.allowed_mime_types).toHaveLength(8)
  })

  it("restricts media policies to owners and never exposes anonymous listing", async () => {
    const rows = await queryAll<PolicyRow>(
      `select policyname from pg_policies where schemaname = 'storage'`
    )
    const policies = rows.map((row) => row.policyname)

    expect(policies).not.toContain("Public can read campaign media")
    expect(policies).toEqual(
      expect.arrayContaining([
        "Owners can read campaign media",
        "Owners can upload campaign media",
        "Owners can update campaign media",
        "Owners can delete campaign media",
      ])
    )
  })
})

describe("supabase/update.sql", () => {
  it("applies on a synchronized database and changes nothing", async () => {
    const before = await fingerprint()
    await db.exec(readSql("update.sql"))
    expect(await fingerprint()).toBe(before)
  }, 60_000)
})

describe("database behaviour", () => {
  beforeAll(async () => {
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values
         ($1, 'owner-a@example.com', '{"full_name":"Owner A"}'),
         ($2, 'owner-b@example.com', '{"full_name":"Owner B"}')`,
      [ownerA, ownerB]
    )
    await db.query(
      `insert into public.subscription_campaigns
         (id, user_id, name, slug, status, draft_config, published_config, published_at)
       values
         ($1, $2, 'Launch', 'launch', 'published', $4::jsonb, $5::jsonb, now()),
         ($6, $3, 'Secret', 'secret-draft', 'draft', $4::jsonb, null, null)`,
      [
        campaignId,
        ownerA,
        ownerB,
        JSON.stringify(draftConfig),
        JSON.stringify(publishedConfig),
        draftCampaignId,
      ]
    )
  }, 60_000)

  it("creates a business profile for every authenticated user", async () => {
    const [row] = await queryAll<CountRow>(`select count(*)::int as count from public.users`)
    expect(row?.count).toBe(2)
  })

  it("only publishes campaigns that are published", async () => {
    const live = await queryAll("select * from public.get_published_campaign('launch')")
    const draft = await queryAll("select * from public.get_published_campaign('secret-draft')")
    const unknown = await queryAll("select * from public.get_published_campaign('missing')")

    expect(live).toHaveLength(1)
    expect(draft).toHaveLength(0)
    expect(unknown).toHaveLength(0)
  })

  it("blocks anonymous reads of business tables", async () => {
    expect(await asRole("anon", null, `select 1 from public.subscribers`)).toBe(false)
    expect(await asRole("anon", null, `select 1 from public.subscription_campaigns`)).toBe(false)
    expect(await asRole("anon", null, `select 1 from public.campaign_page_views`)).toBe(false)
  })

  it("reserves an email once per campaign without revealing duplicates", async () => {
    const first = await asRole(
      "anon",
      null,
      `select public.subscribe_to_campaign('launch', 'User@Gmail.com', '{"role":"dev"}'::jsonb)`
    )
    const second = await asRole(
      "anon",
      null,
      `select public.subscribe_to_campaign('launch', 'user@gmail.com', '{"role":"dev"}'::jsonb)`
    )
    const rows = await queryAll<SubscriberRow>(
      `select email::text as email from public.subscribers where campaign_id = $1`,
      [campaignId]
    )

    expect(first).toBe(true)
    expect(second).toBe(true)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.email).toBe("user@gmail.com")
  })

  it.each([
    ["an unsupported email domain", `'a@corp.internal'`, `'{}'`],
    ["a malformed address", `'not-an-email'`, `'{}'`],
    ["an answer for an unknown question", `'b@gmail.com'`, `'{"role":"dev","ghost":"x"}'`],
    ["a missing required answer", `'c@gmail.com'`, `'{}'`],
    ["a choice outside the published options", `'d@gmail.com'`, `'{"role":"ceo"}'`],
  ])("rejects a reservation with %s", async (_label, email, answers) => {
    const statement = `select public.subscribe_to_campaign('launch', ${email}, ${answers}::jsonb)`
    expect(await asRole("anon", null, statement)).toBe(false)
  })

  it("rejects reservations for a draft campaign", async () => {
    expect(
      await asRole(
        "anon",
        null,
        `select public.subscribe_to_campaign('secret-draft', 'e@gmail.com', '{}'::jsonb)`
      )
    ).toBe(false)
  })

  it("stores page views with hashed identifiers exactly once", async () => {
    const statement = `select public.track_campaign_page_view(
      'launch', '${viewId}', '${visitorId}', '${sessionId}',
      null, 'direct', null, null, 'desktop', 'zh-CN', 'Asia/Shanghai', 'CN', null, null)`

    expect(await asRole("anon", null, statement)).toBe(true)
    expect(await asRole("anon", null, statement)).toBe(true)

    const rows = await queryAll<PageViewRow>(
      `select visitor_hash, char_length(visitor_hash) as hash_length, source, device_type
         from public.campaign_page_views where campaign_id = $1`,
      [campaignId]
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]?.hash_length).toBe(64)
    expect(rows[0]?.visitor_hash).not.toBe(visitorId)
    expect(rows[0]?.source).toBe("direct")
    expect(rows[0]?.device_type).toBe("desktop")
  })

  it("updates engagement on the same view and rejects unknown view ids", async () => {
    expect(
      await asRole(
        "anon",
        null,
        `select public.track_campaign_page_engagement('launch', '${viewId}', 42, 77, 3)`
      )
    ).toBe(true)
    expect(
      await asRole(
        "anon",
        null,
        `select public.track_campaign_page_engagement('launch', 'forged-view-id', 999, 100, 999)`
      )
    ).toBe(false)

    const rows = await queryAll<PageViewRow>(
      `select duration_seconds, max_scroll_depth, interaction_count
         from public.campaign_page_views where campaign_id = $1`,
      [campaignId]
    )

    expect(rows[0]?.duration_seconds).toBe(42)
    expect(rows[0]?.max_scroll_depth).toBe(77)
    expect(rows[0]?.interaction_count).toBe(3)
  })

  it("rejects reservations and direct writes once the signup section is closed", async () => {
    await setPublishedConfig(closedConfig)

    expect(
      await asRole(
        "anon",
        null,
        `select public.subscribe_to_campaign('launch', 'closed@gmail.com', '{}'::jsonb)`
      )
    ).toBe(false)
    expect(
      await allowed(
        `insert into public.subscribers (campaign_id, email) values ('${campaignId}', 'direct@gmail.com')`
      )
    ).toBe(false)

    await setPublishedConfig(publishedConfig)
  })

  it("lets owners read analytics for their own published campaign", async () => {
    await db.exec(`set role authenticated`)
    await db.exec(`set request.jwt.claim.sub = '${ownerA}'`)

    const [analytics] = await queryAll<AnalyticsRow>(
      `select public.get_campaign_analytics($1, 30) as data`,
      [campaignId]
    )
    const [behavior] = await queryAll<AnalyticsRow>(
      `select public.get_campaign_behavior_analytics($1, 30) as data`,
      [campaignId]
    )
    const [subscribers] = await queryAll<SubscriberListRow>(
      `select public.get_campaign_subscribers_with_analytics($1) as data`,
      [campaignId]
    )
    const campaigns = await queryAll<CampaignRow>(`select id from public.subscription_campaigns`)
    const draftAnalytics = await allowed(
      `select public.get_campaign_analytics('${draftCampaignId}', 30)`
    )
    await db.exec("reset role")

    expect(analytics?.data.totals.pageViews).toBe(1)
    expect(analytics?.data.totals.applications).toBe(1)
    expect(typeof behavior?.data.totals.averageDurationSeconds).toBe("number")
    expect(Array.isArray(subscribers?.data)).toBe(true)
    expect(campaigns.map((row) => row.id)).toEqual([campaignId])
    expect(draftAnalytics).toBe(false)
  })

  it("isolates owners from each other", async () => {
    expect(
      await asRole(
        "authenticated",
        ownerB,
        `select public.get_campaign_analytics('${campaignId}', 30)`
      )
    ).toBe(false)

    await db.exec(`set role authenticated`)
    await db.exec(`set request.jwt.claim.sub = '${ownerB}'`)
    const visible = await queryAll<CampaignRow>(`select id from public.subscription_campaigns`)
    await db.exec("reset role")

    expect(visible.map((row) => row.id)).toEqual([draftCampaignId])

    const [launch] = await queryAll<CampaignRow>(
      `select user_id from public.subscription_campaigns where slug = 'launch'`
    )
    expect(launch?.user_id).toBe(ownerA)

    expect(
      await asRole(
        "authenticated",
        ownerB,
        `insert into public.subscription_campaigns (user_id, name, slug) values ('${ownerA}', 'Hijack', 'hijack')`
      )
    ).toBe(false)
  })
})

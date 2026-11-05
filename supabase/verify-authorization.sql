-- Run after 20261104_001_authorization_baseline.sql and first-admin bootstrap.
-- Read-only verification: returns only failing checks. Expected result is zero rows.

with failures as (
  select 'admin_users_missing' as check_name
  where to_regclass('public.admin_users') is null

  union all
  select 'admin_users_empty'
  where to_regclass('public.admin_users') is not null
    and not exists (select 1 from public.admin_users)

  union all
  select 'legacy_review_status_remains'
  where exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'survey_locations'
      and column_name = 'review_status'
  )

  union all
  select 'status_constraint_missing'
  where not exists (
    select 1 from pg_constraint con
    join pg_class t on t.oid = con.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'survey_locations'
      and con.conname = 'survey_locations_status_check'
  )

  union all
  select 'legacy_authenticated_all_policy:' || tablename || ':' || policyname
  from pg_policies
  where schemaname = 'public'
    and tablename in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
    and cmd = 'ALL'
    and roles @> array['authenticated']::name[]
    and coalesce(qual, '') = 'true'
    and coalesce(with_check, '') = 'true'

  union all
  select 'admin_function_public_execute'
  where exists (
    select 1 from information_schema.routine_privileges
    where routine_schema = 'public' and routine_name = 'admin_is_owner'
      and grantee = 'PUBLIC' and privilege_type = 'EXECUTE'
  )

  union all
  select 'approval_function_anon_execute'
  where has_function_privilege('anon', 'public.admin_approve_survey_to_site(uuid)', 'execute')

  union all
  select 'required_policy_missing:' || expected.policyname
  from (values
    ('equipment_catalog_public_read'),
    ('exercise_sites_public_read'),
    ('site_equipment_public_read'),
    ('equipment_catalog_admin_write'),
    ('exercise_sites_admin_write'),
    ('site_equipment_admin_write'),
    ('survey_locations_admin_all')
  ) expected(policyname)
  where not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.policyname = expected.policyname
  )

  union all
  select 'non_admin_survey_policy_remains:' || policyname
  from pg_policies
  where schemaname = 'public' and tablename = 'survey_locations'
    and policyname <> 'survey_locations_admin_all'
    and roles && array['anon', 'authenticated']::name[]

  union all
  select 'survey_admin_policy_missing_admin_check'
  where exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'survey_locations'
      and policyname = 'survey_locations_admin_all'
      and (
        coalesce(qual, '') not ilike '%admin_is_owner%'
        or coalesce(with_check, '') not ilike '%admin_is_owner%'
      )
  )

  union all
  select 'business_rows_remain:' || target.table_name
  from (values
    ('survey_locations'),
    ('exercise_sites'),
    ('equipment_catalog'),
    ('site_equipment')
  ) target(table_name)
  where case target.table_name
    when 'survey_locations' then exists (select 1 from public.survey_locations)
    when 'exercise_sites' then exists (select 1 from public.exercise_sites)
    when 'equipment_catalog' then exists (select 1 from public.equipment_catalog)
    when 'site_equipment' then exists (select 1 from public.site_equipment)
  end
)
select check_name
from failures
order by check_name;


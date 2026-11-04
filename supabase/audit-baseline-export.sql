-- map-apps / walk_fit Supabase read-only metadata audit (single result export)
-- Supabase SQL Editor는 여러 SELECT 중 마지막 결과만 표시할 수 있으므로
-- 주요 감사 결과를 section + JSON 한 표로 합친다. SELECT만 수행한다.

with audit as (
  select 1 as section_order, 'tables_and_rls' as section,
    coalesce(jsonb_agg(to_jsonb(x) order by x.table_name), '[]'::jsonb) as result
  from (
    select c.relname as table_name, c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 2, 'columns', coalesce(jsonb_agg(to_jsonb(x) order by x.table_name, x.ordinal_position), '[]'::jsonb)
  from (
    select table_name, ordinal_position, column_name, data_type, udt_name,
      is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 3, 'constraints', coalesce(jsonb_agg(to_jsonb(x) order by x.table_name, x.constraint_name), '[]'::jsonb)
  from (
    select t.relname as table_name, con.conname as constraint_name,
      case con.contype when 'p' then 'primary_key' when 'f' then 'foreign_key'
        when 'u' then 'unique' when 'c' then 'check' when 'x' then 'exclusion'
        else con.contype::text end as constraint_type,
      pg_get_constraintdef(con.oid, true) as definition
    from pg_constraint con
    join pg_class t on t.oid = con.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 4, 'indexes', coalesce(jsonb_agg(to_jsonb(x) order by x.tablename, x.indexname), '[]'::jsonb)
  from (
    select tablename, indexname, indexdef from pg_indexes
    where schemaname = 'public'
      and tablename in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 5, 'table_policies', coalesce(jsonb_agg(to_jsonb(x) order by x.tablename, x.cmd, x.policyname), '[]'::jsonb)
  from (
    select tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 6, 'rpc_definitions', coalesce(jsonb_agg(to_jsonb(x) order by x.function_name, x.identity_arguments), '[]'::jsonb)
  from (
    select p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_arguments,
      pg_get_function_result(p.oid) as result_type, l.lanname as language,
      p.prosecdef as security_definer, p.provolatile as volatility,
      p.proconfig as runtime_config, pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
    where n.nspname = 'public'
      and p.proname in ('admin_is_owner', 'admin_approve_survey_to_site',
        'get_published_site_photo', 'record_equipment_view')
  ) x

  union all
  select 7, 'rpc_privileges', coalesce(jsonb_agg(to_jsonb(x) order by x.routine_name, x.grantee), '[]'::jsonb)
  from (
    select routine_name, specific_name, grantee, privilege_type, is_grantable
    from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name in ('admin_is_owner', 'admin_approve_survey_to_site',
        'get_published_site_photo', 'record_equipment_view')
  ) x

  union all
  select 8, 'table_privileges', coalesce(jsonb_agg(to_jsonb(x) order by x.table_name, x.grantee, x.privilege_type), '[]'::jsonb)
  from (
    select table_name, grantee, privilege_type, is_grantable
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 9, 'triggers', coalesce(jsonb_agg(to_jsonb(x) order by x.event_object_table, x.trigger_name), '[]'::jsonb)
  from (
    select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table in ('survey_locations', 'exercise_sites', 'equipment_catalog', 'site_equipment')
  ) x

  union all
  select 10, 'related_views', coalesce(jsonb_agg(to_jsonb(x) order by x.viewname), '[]'::jsonb)
  from (
    select viewname, definition from pg_views
    where schemaname = 'public' and (
      definition ilike '%survey_locations%' or definition ilike '%exercise_sites%'
      or definition ilike '%equipment_catalog%' or definition ilike '%site_equipment%')
  ) x

  union all
  select 11, 'storage_buckets', coalesce(jsonb_agg(to_jsonb(x) order by x.id), '[]'::jsonb)
  from (
    select id, name, public, file_size_limit, allowed_mime_types
    from storage.buckets where id in ('survey-photos', 'equipment-images')
  ) x

  union all
  select 12, 'storage_policies', coalesce(jsonb_agg(to_jsonb(x) order by x.cmd, x.policyname), '[]'::jsonb)
  from (
    select policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and (
      coalesce(qual, '') ilike '%survey-photos%' or coalesce(with_check, '') ilike '%survey-photos%'
      or coalesce(qual, '') ilike '%equipment-images%' or coalesce(with_check, '') ilike '%equipment-images%')
  ) x

  union all
  select 13, 'extensions', coalesce(jsonb_agg(to_jsonb(x) order by x.extname), '[]'::jsonb)
  from (
    select extname, extversion from pg_extension
    where extname in ('pg_graphql', 'pgcrypto', 'postgis', 'uuid-ossp')
  ) x
)
select section, result
from audit
order by section_order;


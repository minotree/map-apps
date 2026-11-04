-- map-apps / walk_fit Supabase read-only metadata audit
-- 기준일: 2026-11-04
--
-- Supabase SQL Editor에서 실행한다. 이 파일은 SELECT만 포함하며 데이터 행,
-- auth.users, 비밀값을 조회하거나 DB 객체를 변경하지 않는다.

-- 1. 대상 테이블과 RLS 활성 상태
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by c.relname;

-- 2. 열, 타입, nullable, 기본값
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by table_name, ordinal_position;

-- 3. PK, FK, UNIQUE, CHECK 제약
select
  n.nspname as schema_name,
  t.relname as table_name,
  con.conname as constraint_name,
  case con.contype
    when 'p' then 'primary_key'
    when 'f' then 'foreign_key'
    when 'u' then 'unique'
    when 'c' then 'check'
    when 'x' then 'exclusion'
    else con.contype::text
  end as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class t on t.oid = con.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by t.relname, constraint_type, con.conname;

-- 4. 인덱스와 부분 인덱스 조건
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by tablename, indexname;

-- 5. 대상 테이블 RLS 정책
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by tablename, cmd, policyname;

-- 6. 앱이 참조하는 RPC 정의와 보안 속성
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as result_type,
  l.lanname as language,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  p.proconfig as runtime_config,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.proname in (
    'admin_is_owner',
    'admin_approve_survey_to_site',
    'get_published_site_photo',
    'record_equipment_view'
  )
order by p.proname, identity_arguments;

-- 7. RPC 실행 권한. PUBLIC 부여 여부도 확인한다.
select
  routine_schema,
  routine_name,
  specific_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'admin_is_owner',
    'admin_approve_survey_to_site',
    'get_published_site_photo',
    'record_equipment_view'
  )
order by routine_name, grantee, privilege_type;

-- 8. 대상 테이블 직접 권한
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by table_name, grantee, privilege_type;

-- 9. 대상 테이블 트리거
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'survey_locations',
    'exercise_sites',
    'equipment_catalog',
    'site_equipment'
  )
order by event_object_table, trigger_name, event_manipulation;

-- 10. 대상 테이블을 참조하는 public 뷰
select
  schemaname,
  viewname,
  definition
from pg_views
where schemaname = 'public'
  and (
    definition ilike '%survey_locations%'
    or definition ilike '%exercise_sites%'
    or definition ilike '%equipment_catalog%'
    or definition ilike '%site_equipment%'
  )
order by viewname;

-- 11. 앱이 참조하는 Storage 버킷 메타데이터. 객체 행은 조회하지 않는다.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id in ('survey-photos', 'equipment-images')
order by id;

-- 12. 대상 버킷과 관련된 storage.objects 정책
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    coalesce(qual, '') ilike '%survey-photos%'
    or coalesce(with_check, '') ilike '%survey-photos%'
    or coalesce(qual, '') ilike '%equipment-images%'
    or coalesce(with_check, '') ilike '%equipment-images%'
  )
order by cmd, policyname;

-- 13. 감사 해석에 영향을 주는 확장 활성 상태
select
  extname,
  extversion
from pg_extension
where extname in ('pg_graphql', 'pgcrypto', 'postgis', 'uuid-ossp')
order by extname;


-- DESTRUCTIVE: current walk_fit business data is intentionally disposable.
-- NOT YET APPLIED. Apply only with explicit production approval and bootstrap the first admin immediately.
begin;

lock table public.site_equipment, public.exercise_sites,
  public.equipment_catalog, public.survey_locations in access exclusive mode;

-- The current project is a new baseline. Preserve no business rows or legacy state values.
truncate table
  public.site_equipment,
  public.exercise_sites,
  public.equipment_catalog,
  public.survey_locations
restart identity cascade;

-- One canonical workflow status. The application and approval RPC already use `status`.
drop index if exists public.survey_locations_status_created_idx;
alter table public.survey_locations drop column if exists review_status;
alter table public.survey_locations
  drop constraint if exists survey_locations_status_check;
alter table public.survey_locations
  add constraint survey_locations_status_check
  check (status in ('pending', 'approved', 'rejected'));
create index if not exists survey_locations_status_created_idx
  on public.survey_locations (status, created_at desc);

-- DB columns store Cloudflare object keys, never R2 credentials or signed URLs.
comment on column public.survey_locations.stamped_photo_path is
  'Cloudflare R2 object key for the site overview image; not a Supabase Storage path or credential.';
comment on column public.equipment_catalog.default_image_path is
  'Cloudflare R2 object key for the reviewed equipment image; not a Supabase Storage path or credential.';
comment on column public.exercise_sites.site_image_path is
  'Legacy compatibility only. New writes use survey_locations.stamped_photo_path as a Cloudflare R2 object key.';

-- Server-managed allowlist. Authentication alone never grants administrator access.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;

create or replace function public.admin_is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.admin_users a where a.user_id = auth.uid()
    );
$$;
revoke all on function public.admin_is_owner() from public, anon;
grant execute on function public.admin_is_owner() to authenticated, service_role;

-- Remove legacy policies that treated every authenticated user as an administrator.
drop policy if exists "Allow authenticated full access on equipment_catalog" on public.equipment_catalog;
drop policy if exists "Allow authenticated full access on exercise_sites" on public.exercise_sites;
drop policy if exists "Allow authenticated full access on site_equipment" on public.site_equipment;
drop policy if exists "Allow authenticated full access on survey_locations" on public.survey_locations;
drop policy if exists equipment_catalog_public_read on public.equipment_catalog;
drop policy if exists exercise_sites_public_read on public.exercise_sites;
drop policy if exists site_equipment_public_read on public.site_equipment;
drop policy if exists survey_locations_operator_insert on public.survey_locations;
drop policy if exists survey_locations_operator_select on public.survey_locations;
drop policy if exists survey_locations_operator_update on public.survey_locations;
drop policy if exists walkfit_no_anon_surveys on public.survey_locations;

-- Grants provide the SQL operation surface; RLS below decides which authenticated user may use it.
revoke all on public.equipment_catalog, public.exercise_sites,
  public.site_equipment, public.survey_locations from anon, authenticated;
grant select on public.equipment_catalog, public.exercise_sites, public.site_equipment to anon;
grant select, insert, update, delete on public.equipment_catalog, public.exercise_sites,
  public.site_equipment, public.survey_locations to authenticated;

create policy equipment_catalog_public_read
on public.equipment_catalog for select
to anon, authenticated
using (true);

create policy exercise_sites_public_read
on public.exercise_sites for select
to anon, authenticated
using (is_published is true);

create policy site_equipment_public_read
on public.site_equipment for select
to anon, authenticated
using (
  is_published is true
  and exists (
    select 1 from public.exercise_sites s
    where s.id = site_equipment.site_id and s.is_published is true
  )
);

create policy equipment_catalog_admin_write
on public.equipment_catalog for all
to authenticated
using ((select public.admin_is_owner()))
with check ((select public.admin_is_owner()));

create policy exercise_sites_admin_write
on public.exercise_sites for all
to authenticated
using ((select public.admin_is_owner()))
with check ((select public.admin_is_owner()));

create policy site_equipment_admin_write
on public.site_equipment for all
to authenticated
using ((select public.admin_is_owner()))
with check ((select public.admin_is_owner()));

-- fit-survey and fit-admin are both restricted to allowlisted administrators.
create policy survey_locations_admin_all
on public.survey_locations for all
to authenticated
using ((select public.admin_is_owner()))
with check ((select public.admin_is_owner()));

-- Approval remains invoker-security and therefore also depends on the table RLS above.
create or replace function public.admin_approve_survey_to_site(p_survey_id uuid)
returns public.exercise_sites
language plpgsql
security invoker
set search_path = ''
as $$
declare
  survey public.survey_locations%rowtype;
  site public.exercise_sites%rowtype;
  changed_id uuid;
begin
  if not coalesce(public.admin_is_owner(), false) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select * into survey
  from public.survey_locations
  where id = p_survey_id
  for update;
  if not found then raise exception 'Survey not found or access denied'; end if;
  if survey.status = 'rejected' then raise exception 'Rejected surveys cannot be approved'; end if;

  select * into site
  from public.exercise_sites
  where survey_location_id = survey.id
  for update;

  if not found and survey.linked_site_id is not null then
    select * into site
    from public.exercise_sites
    where id = survey.linked_site_id
    for update;
    if not found then raise exception 'Linked site not found or access denied'; end if;
    if site.survey_location_id is not null and site.survey_location_id <> survey.id then
      raise exception 'Site is linked to another survey';
    end if;
    update public.exercise_sites
      set survey_location_id = survey.id
      where id = site.id
      returning * into site;
    if not found then raise exception 'Site link update denied'; end if;
  end if;

  if site.id is null then
    if survey.status = 'approved' then
      raise exception 'Approved survey has no site; repair its link first';
    end if;
    insert into public.exercise_sites
      (name, latitude, longitude, address_text, amenity_note,
       survey_location_id, is_published, last_verified_at)
    values
      (coalesce(nullif(btrim(survey.facility_name), ''),
        nullif(btrim(survey.address), ''), '신규 수집 지점'),
       survey.latitude, survey.longitude, coalesce(survey.address, ''),
       coalesce(survey.review_note, ''), survey.id, false,
       (current_timestamp at time zone 'Asia/Seoul')::date)
    returning * into site;
  end if;

  if survey.linked_site_id is not null and survey.linked_site_id <> site.id then
    raise exception 'Survey/site links disagree';
  end if;

  update public.survey_locations
    set status = 'approved', linked_site_id = site.id
    where id = survey.id
    returning id into changed_id;
  if changed_id is null then raise exception 'Survey approval update denied'; end if;
  return site;
end;
$$;
revoke all on function public.admin_approve_survey_to_site(uuid) from public, anon;
grant execute on function public.admin_approve_survey_to_site(uuid) to authenticated, service_role;

-- Public clients only receive the Cloudflare object key for an approved, published site.
create or replace function public.get_published_site_photo(p_site_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(btrim(q.stamped_photo_path), '')
  from public.exercise_sites s
  join public.survey_locations q on q.id = s.survey_location_id
  where s.id = p_site_id
    and s.is_published is true
    and q.status = 'approved';
$$;
revoke all on function public.get_published_site_photo(uuid) from public;
grant execute on function public.get_published_site_photo(uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;


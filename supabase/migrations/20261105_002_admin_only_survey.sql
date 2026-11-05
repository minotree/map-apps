-- fit-survey is an administrator-only field tool. Authentication alone must
-- never grant access to survey rows.
begin;

drop policy if exists survey_locations_owner_insert on public.survey_locations;
drop policy if exists survey_locations_owner_select on public.survey_locations;

notify pgrst, 'reload schema';
commit;

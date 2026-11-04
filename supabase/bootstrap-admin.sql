-- 첫 관리자 bootstrap 보조 SQL
-- 이 파일은 그대로 전체 실행하지 않는다. migration 적용 직후 SQL Editor에서 단계별로 사용한다.

-- 1. 현재 Auth 사용자 중 운영자 계정의 UUID를 확인한다.
-- 이메일은 SQL Editor 화면에서만 확인하고 결과를 Git이나 문서에 저장하지 않는다.
select id, email, created_at
from auth.users
order by created_at;

-- 2. 아래 예시를 새 쿼리로 복사한 뒤 UUID를 운영자 계정의 실제 UUID로 바꿔 실행한다.
-- placeholder UUID를 그대로 사용하면 외래키 검사로 실패해야 한다.
--
-- insert into public.admin_users (user_id)
-- values ('00000000-0000-0000-0000-000000000000'::uuid)
-- on conflict (user_id) do nothing;

-- 3. 등록 결과를 확인한다. 이메일은 저장하지 않고 UUID와 등록 시각만 관리한다.
select user_id, created_at
from public.admin_users
order by created_at;


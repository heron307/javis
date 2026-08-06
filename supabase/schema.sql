-- J.A.V.I.S. 사용자별 클라우드 데이터 (Supabase SQL Editor에서 실행)

create table if not exists public.javis_user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.javis_user_data enable row level security;

drop policy if exists "javis_user_data_select_own" on public.javis_user_data;
create policy "javis_user_data_select_own"
  on public.javis_user_data
  for select
  using (auth.uid() = user_id);

drop policy if exists "javis_user_data_insert_own" on public.javis_user_data;
create policy "javis_user_data_insert_own"
  on public.javis_user_data
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "javis_user_data_update_own" on public.javis_user_data;
create policy "javis_user_data_update_own"
  on public.javis_user_data
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "javis_user_data_delete_own" on public.javis_user_data;
create policy "javis_user_data_delete_own"
  on public.javis_user_data
  for delete
  using (auth.uid() = user_id);

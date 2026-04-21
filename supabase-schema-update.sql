-- ============================================
-- MyLinkBox 업데이트 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. links 테이블에 price_history 컬럼 추가
alter table public.links
  add column if not exists last_price text,
  add column if not exists price_updated_at timestamptz;

-- 2. price_history 테이블 (가격 변동 로그)
create table if not exists public.price_history (
  id         uuid default gen_random_uuid() primary key,
  link_id    uuid references public.links(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  old_price  text,
  new_price  text,
  changed_at timestamptz default now() not null
);

alter table public.price_history enable row level security;

create policy "price_history: 본인만 조회" on public.price_history
  for select using (auth.uid() = user_id);

create policy "price_history: 본인만 추가" on public.price_history
  for insert with check (auth.uid() = user_id);

create index if not exists price_history_link_id_idx on public.price_history (link_id);
create index if not exists price_history_user_id_idx on public.price_history (user_id);

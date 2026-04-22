-- ============================================
-- Damoajo 업데이트 스키마 2
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- links 테이블에 태그, 즐겨찾기 컬럼 추가
alter table public.links
  add column if not exists tags text[] default '{}',
  add column if not exists is_favorite boolean default false;

-- 인덱스
create index if not exists links_is_favorite_idx on public.links (user_id, is_favorite);
create index if not exists links_tags_idx on public.links using gin (tags);

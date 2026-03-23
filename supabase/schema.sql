-- ============================================================
-- walkToo Database Schema
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. profiles (유저 프로필)
-- Supabase Auth의 auth.users.id와 1:1 연결
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  phone text not null default '',
  profile_image_url text,
  birthday date,
  couple_id uuid,
  is_profile_complete boolean not null default false,
  total_walks integer not null default 0,
  total_steps integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. couples (커플)
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete set null,
  invite_code text not null unique,
  start_date date not null default current_date,
  first_met_date date,
  created_at timestamptz not null default now()
);

-- profiles.couple_id → couples.id FK (couples 테이블 생성 후)
alter table public.profiles
  add constraint profiles_couple_id_fkey
  foreign key (couple_id) references public.couples(id) on delete set null;

-- 3. walks (산책)
create table if not exists public.walks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  date date not null,
  location_name text not null,
  steps integer not null default 0,
  is_revealed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. footprint_entries (발자취 엔트리)
create table if not exists public.footprint_entries (
  id uuid primary key default gen_random_uuid(),
  walk_id uuid not null references public.walks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  memo text not null default '',
  photos text[] not null default '{}',
  written_at timestamptz not null default now(),

  -- 한 산책에 같은 유저가 두 번 작성 방지
  unique(walk_id, user_id)
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_walks_couple_id on public.walks(couple_id);
create index if not exists idx_walks_date on public.walks(date desc);
create index if not exists idx_footprint_entries_walk_id on public.footprint_entries(walk_id);
create index if not exists idx_couples_invite_code on public.couples(invite_code);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.walks enable row level security;
alter table public.footprint_entries enable row level security;

-- profiles: 본인 프로필만 CRUD
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- profiles: 커플 상대방 프로필도 조회 가능
create policy "profiles_select_partner" on public.profiles
  for select using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- couples: 본인 커플 + 대기 중 초대코드 조회 가능
create policy "couples_select" on public.couples
  for select using (
    user1_id = auth.uid()
    or user2_id = auth.uid()
    or (user2_id is null and invite_code is not null)
  );

create policy "couples_insert_own" on public.couples
  for insert with check (user1_id = auth.uid());

create policy "couples_update" on public.couples
  for update using (
    user1_id = auth.uid()
    or user2_id = auth.uid()
    or (user2_id is null and invite_code is not null)
  );

create policy "couples_delete_own" on public.couples
  for delete using (
    user1_id = auth.uid() and user2_id is null
  );

-- walks: 본인 커플의 산책만
create policy "walks_select_own_couple" on public.walks
  for select using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "walks_insert_own_couple" on public.walks
  for insert with check (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "walks_update_own_couple" on public.walks
  for update using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

create policy "walks_delete_own_couple" on public.walks
  for delete using (
    couple_id in (
      select couple_id from public.profiles where id = auth.uid()
    )
  );

-- footprint_entries: 본인 커플의 엔트리만
create policy "entries_select_own_couple" on public.footprint_entries
  for select using (
    walk_id in (
      select w.id from public.walks w
      join public.profiles p on p.couple_id = w.couple_id
      where p.id = auth.uid()
    )
  );

create policy "entries_insert_own" on public.footprint_entries
  for insert with check (user_id = auth.uid());

create policy "entries_update_own" on public.footprint_entries
  for update using (user_id = auth.uid());

-- ============================================================
-- Storage (사진 업로드)
-- ============================================================

-- footprints 버킷 생성 (Supabase Dashboard > Storage에서도 가능)
insert into storage.buckets (id, name, public)
values ('footprints', 'footprints', true)
on conflict (id) do nothing;

-- Storage RLS: 인증된 유저만 업로드, 공개 읽기
create policy "footprints_upload" on storage.objects
  for insert with check (
    bucket_id = 'footprints' and auth.role() = 'authenticated'
  );

create policy "footprints_public_read" on storage.objects
  for select using (bucket_id = 'footprints');

create policy "footprints_delete_own" on storage.objects
  for delete using (
    bucket_id = 'footprints' and auth.role() = 'authenticated'
  );

-- ============================================================
-- Auto-update updated_at
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      '사용자'
    ),
    coalesce(new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

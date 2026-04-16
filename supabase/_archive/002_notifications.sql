-- ============================================================
-- 알림 시스템 마이그레이션
-- Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 1. profiles에 push_token 추가
alter table public.profiles
  add column if not exists push_token text;

-- 2. notifications (알림 이력)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  couple_id uuid references public.couples(id) on delete cascade,
  type text not null,                    -- 'couple_joined' | 'walk_created' | 'walk_revealed' | 'nudge'
  title text not null,
  body text not null,
  data jsonb not null default '{}',      -- { walkId, coupleId 등 }
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_notifications_recipient
  on public.notifications(recipient_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(recipient_id, is_read)
  where is_read = false;

-- 4. RLS
alter table public.notifications enable row level security;

-- 본인 알림만 조회
create policy "notifications_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

-- 인증된 유저가 알림 생성 (서비스에서 사용)
create policy "notifications_insert_auth" on public.notifications
  for insert with check (auth.role() = 'authenticated');

-- 본인 알림만 수정 (읽음 처리)
create policy "notifications_update_own" on public.notifications
  for update using (recipient_id = auth.uid());

-- 본인 알림만 삭제
create policy "notifications_delete_own" on public.notifications
  for delete using (recipient_id = auth.uid());

-- Forja: dados do app, assinatura Hotmart e fotos de perfil.
-- Rode no SQL Editor do Supabase ou via CLI. service_role ignora RLS e fica só no servidor.

create table if not exists public.app_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

drop policy if exists "app_data_own" on public.app_data;
create policy "app_data_own" on public.app_data
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.app_data to authenticated;

create table if not exists public.entitlements (
  email text primary key,
  user_id uuid references auth.users (id) on delete set null,
  hotmart_subscriber_code text,
  status text not null,
  product_id text,
  current_period_end timestamptz,
  hotmart_event_id text,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "entitlements_read_own" on public.entitlements;
create policy "entitlements_read_own" on public.entitlements
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

grant select on public.entitlements to authenticated;

create table if not exists public.hotmart_events (
  id text primary key,
  received_at timestamptz not null default now()
);

alter table public.hotmart_events enable row level security;
revoke all on public.hotmart_events from anon, authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

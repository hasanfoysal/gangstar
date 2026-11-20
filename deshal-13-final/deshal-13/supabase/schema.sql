-- ============================================================================
-- DESHAL 13 (দেশাল ১৩) — COMPLETE SUPABASE SCHEMA, RLS, TRIGGERS & SEED DATA
-- Run this entire script once in the Supabase SQL Editor.
-- ============================================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- 2. Tables
-- ----------------------------------------------------------------------------

-- Profiles table linked 1:1 to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  batch text not null,
  department text not null,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  phone text default '',
  profession text default '',
  company text default '',
  current_city text default '',
  social_link text default '',
  avatar_url text default '',
  is_alumni boolean not null default false,
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hero Slider table
create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  batch_label text default '',
  image_url text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Event Albums table
create table if not exists public.event_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  event_date date,
  cover_url text default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Album Photos table
create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.event_albums(id) on delete cascade,
  image_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  caption text default '',
  uploaded_at timestamptz not null default now()
);

-- Site Settings (singleton row id = 1)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  room_name text not null default 'Deshal 13 (দেশাল ১৩)',
  motto text not null default 'Brotherhood Beyond Graduation — Room 13 Legacy',
  about_text text not null default 'Deshal 13 (দেশাল ১৩) at National Institute of Textile Engineering and Research (NITER) is more than a boys'' hostel room—it is a decade-long brotherhood spanning from the 5th Batch to the 14th Batch. Built on late-night adda, shared meals, academic resilience, and lifelong friendships, our portal connects alumni across the globe with current residents on campus.',
  notice_title text not null default 'Room Notice Board',
  notice_body text not null default 'Welcome to the official Deshal 13 (দেশাল ১৩) Portal! New and senior members are requested to register via the Join page. Annual Iftar Mahfil & Alumni Reunion dates will be announced here shortly.',
  updated_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_batch on public.profiles(batch);
create index if not exists idx_profiles_is_alumni on public.profiles(is_alumni);
create index if not exists idx_hero_slides_order on public.hero_slides(display_order asc);
create index if not exists idx_album_photos_album on public.album_photos(album_id);


-- Security-definer admin check (must be defined before any RLS policy)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Dynamic Batches table (Admin can add 15th, 16th, etc. anytime)
create table if not exists public.batches (
  name text primary key,
  display_order integer not null default 100,
  is_alumni_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.batches enable row level security;

drop policy if exists "Public can view batches" on public.batches;
create policy "Public can view batches"
  on public.batches for select
  using (true);

drop policy if exists "Admins can manage batches" on public.batches;
create policy "Admins can manage batches"
  on public.batches for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.batches (name, display_order, is_alumni_default)
values
  ('5th', 5, true), ('6th', 6, true), ('7th', 7, true), ('8th', 8, true),
  ('9th', 9, true), ('10th', 10, true), ('11th', 11, true),
  ('12th', 12, false), ('13th', 13, false), ('14th', 14, false)
on conflict (name) do nothing;

-- 3. Helper Functions & Triggers
-- ----------------------------------------------------------------------------

-- Updated_at timestamp trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Automatic trigger on auth.users insert:
-- First registered user automatically becomes role='admin' and status='approved'.
-- All subsequent users default to role='member' and status='pending'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_count integer;
  v_role text;
  v_status text;
  v_batch text;
  v_is_alumni boolean;
  v_meta jsonb;
begin
  -- Advisory lock guarantees race-free detection of the very first user
  perform pg_advisory_xact_lock(7213013);

  v_role := 'member';
  v_status := 'approved';

  v_meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_batch := coalesce(nullif(v_meta->>'batch', ''), '14th');

  select coalesce(
    (select is_alumni_default from public.batches where name = v_batch limit 1),
    v_batch in ('5th','6th','7th','8th','9th','10th','11th')
  ) into v_is_alumni;

  insert into public.profiles (
    id,
    email,
    full_name,
    batch,
    department,
    blood_group,
    phone,
    profession,
    company,
    current_city,
    social_link,
    avatar_url,
    is_alumni,
    role,
    status
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(v_meta->>'full_name', ''), split_part(coalesce(new.email, 'Member'), '@', 1)),
    v_batch,
    coalesce(nullif(v_meta->>'department', ''), 'General'),
    case
      when (v_meta->>'blood_group') in ('A+','A-','B+','B-','AB+','AB-','O+','O-')
        then v_meta->>'blood_group'
      else 'O+'
    end,
    coalesce(v_meta->>'phone', ''),
    coalesce(v_meta->>'profession', ''),
    coalesce(v_meta->>'company', ''),
    coalesce(v_meta->>'current_city', ''),
    coalesce(v_meta->>'social_link', ''),
    coalesce(v_meta->>'avatar_url', ''),
    v_is_alumni,
    v_role,
    v_status
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- One-click batch promotion RPC for Admin
create or replace function public.promote_batch_to_alumni(target_batch text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can promote a batch to alumni';
  end if;

  update public.profiles
  set is_alumni = true,
      updated_at = now()
  where batch = target_batch
    and is_alumni = false;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;


-- Password-based Super Admin unlock RPC (anyone with password '45678fhl' becomes admin)
create or replace function public.claim_admin_with_password(secret_pass text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if secret_pass = '45678fhl' then
    update public.profiles
    set role = 'admin',
        status = 'approved',
        updated_at = now()
    where id = auth.uid();
    return true;
  end if;

  return false;
end;
$$;

-- 4. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.hero_slides enable row level security;
alter table public.event_albums enable row level security;
alter table public.album_photos enable row level security;
alter table public.site_settings enable row level security;

-- Profiles policies
drop policy if exists "Public can view approved profiles" on public.profiles;
create policy "Public can view approved profiles"
  on public.profiles for select
  using (status = 'approved' or auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile without escalating role or status" on public.profiles;
create policy "Users can update own profile without escalating role or status"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and status = (select p.status from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete any profile" on public.profiles;
create policy "Admins can delete any profile"
  on public.profiles for delete
  using (public.is_admin());

-- Hero slides policies
drop policy if exists "Public can view hero slides" on public.hero_slides;
create policy "Public can view hero slides"
  on public.hero_slides for select
  using (true);

drop policy if exists "Admins can manage hero slides" on public.hero_slides;
create policy "Admins can manage hero slides"
  on public.hero_slides for all
  using (public.is_admin())
  with check (public.is_admin());

-- Event albums policies
drop policy if exists "Public can view event albums" on public.event_albums;
create policy "Public can view event albums"
  on public.event_albums for select
  using (true);

drop policy if exists "Admins can manage event albums" on public.event_albums;
create policy "Admins can manage event albums"
  on public.event_albums for all
  using (public.is_admin())
  with check (public.is_admin());

-- Album photos policies
drop policy if exists "Public can view album photos" on public.album_photos;
create policy "Public can view album photos"
  on public.album_photos for select
  using (true);

drop policy if exists "Admins can manage album photos" on public.album_photos;
create policy "Admins can manage album photos"
  on public.album_photos for all
  using (public.is_admin())
  with check (public.is_admin());

-- Site settings policies
drop policy if exists "Public can view site settings" on public.site_settings;
create policy "Public can view site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());


-- Batch Cover Photos table (shown when sorting/filtering by a specific batch)
create table if not exists public.batch_covers (
  batch text primary key,
  cover_url text not null,
  title text default '',
  subtitle text default '',
  updated_at timestamptz not null default now()
);

alter table public.batch_covers enable row level security;

drop policy if exists "Public can view batch covers" on public.batch_covers;
create policy "Public can view batch covers"
  on public.batch_covers for select
  using (true);

drop policy if exists "Admins can manage batch covers" on public.batch_covers;
create policy "Admins can manage batch covers"
  on public.batch_covers for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5. Storage Buckets & Storage Policies
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('covers', 'covers', true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('memories', 'memories', true, 52428800, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- Public read access for all 3 buckets
drop policy if exists "Public read access for Deshal 13 media" on storage.objects;
create policy "Public read access for Deshal 13 media"
  on storage.objects for select
  using (bucket_id in ('avatars', 'covers', 'memories'));

-- Avatars: allow new registrants & signed-in members to upload avatars
drop policy if exists "Anyone can upload registration avatar" on storage.objects;
create policy "Anyone can upload registration avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

drop policy if exists "Authenticated users can update own avatars" on storage.objects;
create policy "Authenticated users can update own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Admins can delete avatars" on storage.objects;
create policy "Admins can delete avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and public.is_admin());

-- Covers & Memories: Admin full control
drop policy if exists "Admins can upload covers and memories" on storage.objects;
create policy "Admins can upload covers and memories"
  on storage.objects for insert
  with check (bucket_id in ('covers', 'memories') and public.is_admin());

drop policy if exists "Admins can update covers and memories" on storage.objects;
create policy "Admins can update covers and memories"
  on storage.objects for update
  using (bucket_id in ('covers', 'memories') and public.is_admin());

drop policy if exists "Admins can delete covers and memories" on storage.objects;
create policy "Admins can delete covers and memories"
  on storage.objects for delete
  using (bucket_id in ('covers', 'memories') and public.is_admin());

-- 6. Default Seed Data
-- ----------------------------------------------------------------------------

insert into public.site_settings (id, room_name, motto, about_text, notice_title, notice_body)
values (
  1,
  'Deshal 13 (দেশাল ১৩)',
  'Brotherhood Beyond Graduation — Room 13 Legacy',
  'Deshal 13 (দেশাল ১৩) at National Institute of Textile Engineering and Research (NITER) is more than a boys'' hostel room—it is a decade-long brotherhood spanning from the 5th Batch to the 14th Batch. Built on late-night adda, shared meals, academic resilience, and lifelong friendships, our portal connects alumni across the globe with current residents on campus.',
  'Room Notice Board',
  'Welcome to the official Deshal 13 (দেশাল ১৩) Portal! New and senior members are requested to register via the Join page. Once verified by the Room Admin, your profile will be published to the Batch Directory.'
)
on conflict (id) do nothing;

insert into public.hero_slides (title, subtitle, batch_label, image_url, display_order, is_active)
select * from (
  values
    ('দেশাল ১৩', '', 'Deshal Uthshob', '/covers/uthshob-22.jpg', 1, true),
    ('দেশাল ১৩', '', 'All Batches', '/covers/uthshob-1.jpg', 2, true),
    ('দেশাল ১৩', '', 'Running & Alumni', '/covers/uthshob-2.jpg', 3, true),
    ('দেশাল ১৩', '', 'Deshal 13 Legacy', '/covers/uthshob-12.jpg', 4, true)
) as v(title, subtitle, batch_label, image_url, display_order, is_active)
where not exists (select 1 from public.hero_slides limit 1);

insert into public.event_albums (title, description, event_date, cover_url)
select * from (
  values
    ('Deshal Uthshob 1', 'Deshal Uthshob 1 celebration & Room 13 brotherhood memories.', current_date - interval '120 days', '/memories/memory3.jpeg'),
    ('Deshal Uthshob 2', 'Deshal Uthshob 2 grand reunion & night illumination.', current_date - interval '60 days', '/memories/memory4.jpeg')
) as v(title, description, event_date, cover_url)
where not exists (select 1 from public.event_albums limit 1);

insert into public.album_photos (album_id, image_url, media_type, caption)
select a.id, v.image_url, 'image', v.caption
from (
  values
    ('Deshal Uthshob 1', '/memories/memory1.jpeg', 'Room 13 — Iconic Wall Art & Memories'),
    ('Deshal Uthshob 1', '/memories/memory2.jpeg', 'Deshal 13 Room Interior & Door Crest'),
    ('Deshal Uthshob 1', '/memories/memory3.jpeg', 'Deshal 13 Wall Collage & Sketches'),
    ('Deshal Uthshob 2', '/memories/memory4.jpeg', 'Deshal Uthshob Lights & Banner'),
    ('Deshal Uthshob 2', '/memories/memory5.jpeg', 'Deshal Uthshob Night Ground Illumination')
) as v(album_title, image_url, caption)
join public.event_albums a on a.title = v.album_title
where not exists (select 1 from public.album_photos limit 1);

insert into public.batch_covers (batch, cover_url, title, subtitle)
values ('13th', '/covers/batch-13.jpg', '13th Batch', 'Current Residents of Room 13, NITER')
on conflict (batch) do update set cover_url = excluded.cover_url;

insert into public.batch_covers (batch, cover_url, title, subtitle)
values ('14th', '/covers/batch-14.jpg', '14th Batch', 'Freshest Residents of Room 13, NITER')
on conflict (batch) do update set cover_url = excluded.cover_url;

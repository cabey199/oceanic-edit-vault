-- Oceanic Archive foundation schema.
-- Apply through Supabase migrations after reviewing the project-specific auth settings.

create type public.archive_role as enum ('viewer', 'editor', 'developer');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.storage_provider as enum ('r2', 'b2');
create type public.archive_media_kind as enum ('original', 'playback', 'thumbnail');

create table public.archive_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.archive_role not null default 'viewer',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.archive_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(trim(email)) > 3),
  role public.archive_role not null default 'viewer',
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.archive_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  note text,
  format text not null check (format in ('9:16', '16:9')),
  duration_seconds numeric(10, 3),
  width integer,
  height integer,
  codec text,
  favorite boolean not null default false,
  archived boolean not null default false,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.archive_media_objects (
  id uuid primary key default gen_random_uuid(),
  archive_item_id uuid not null references public.archive_items(id) on delete cascade,
  provider public.storage_provider not null,
  kind public.archive_media_kind not null,
  object_key text not null unique,
  byte_size bigint not null check (byte_size >= 0),
  content_type text not null,
  created_at timestamptz not null default now(),
  unique (archive_item_id, kind)
);

create index archive_invitations_email_idx on public.archive_invitations (lower(email));
create index archive_items_owner_created_idx on public.archive_items (owner_id, created_at desc);
create index archive_media_objects_provider_idx on public.archive_media_objects (provider);

create or replace function public.is_archive_member(required_role public.archive_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.archive_memberships membership
    where membership.user_id = auth.uid()
      and (
        membership.role = required_role
        or membership.role = 'developer'
        or (required_role = 'viewer' and membership.role = 'editor')
      )
  );
$$;

alter table public.archive_memberships enable row level security;
alter table public.archive_invitations enable row level security;
alter table public.archive_items enable row level security;
alter table public.archive_media_objects enable row level security;

create policy "members can read memberships"
on public.archive_memberships for select
using (auth.uid() = user_id or public.is_archive_member('developer'));

create policy "developers manage memberships"
on public.archive_memberships for all
using (public.is_archive_member('developer'))
with check (public.is_archive_member('developer'));

create policy "developers manage invitations"
on public.archive_invitations for all
using (public.is_archive_member('developer'))
with check (public.is_archive_member('developer'));

create policy "members read archive items"
on public.archive_items for select
using (public.is_archive_member('viewer'));

create policy "editors manage archive items"
on public.archive_items for all
using (public.is_archive_member('editor'))
with check (public.is_archive_member('editor'));

create policy "members read media metadata"
on public.archive_media_objects for select
using (public.is_archive_member('viewer'));

create policy "editors manage media metadata"
on public.archive_media_objects for all
using (public.is_archive_member('editor'))
with check (public.is_archive_member('editor'));

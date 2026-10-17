-- Named vault sections for organizing uploads without changing the media storage model.
create table if not exists public.archive_sections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  created_at timestamptz not null default now(),
  unique (owner_id, slug)
);

alter table public.archive_items
  add column if not exists section_id uuid references public.archive_sections(id) on delete set null;

alter table public.archive_items
  add column if not exists section_name text not null default 'General Vault';

create index if not exists archive_items_owner_section_idx
  on public.archive_items (owner_id, section_id, created_at desc);

alter table public.archive_sections enable row level security;

create policy "members read own archive sections"
  on public.archive_sections for select
  using (owner_id = auth.uid() and public.is_archive_member('viewer'));

create policy "editors manage own archive sections"
  on public.archive_sections for all
  using (owner_id = auth.uid() and public.is_archive_member('editor'))
  with check (owner_id = auth.uid() and public.is_archive_member('editor'));

-- Keep existing rows grouped consistently after the column is introduced.
update public.archive_items
set section_name = 'General Vault'
where section_name is null or length(trim(section_name)) = 0;

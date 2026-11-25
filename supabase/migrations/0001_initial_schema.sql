-- World Life RPG: initial database schema
-- Run this file in the Supabase SQL Editor.
-- All player-owned tables use RLS. Privileged game rewards should later
-- be performed by trusted server-side functions, not direct client updates.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '冒険者' check (char_length(display_name) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 16),
  level integer not null default 1 check (level between 1 and 100),
  experience bigint not null default 0 check (experience >= 0),
  region_id text not null default 'starting_meadow',
  position_x real not null default 380,
  position_y real not null default 250,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.inventory_stacks (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  item_id text not null,
  quantity bigint not null default 1 check (quantity > 0),
  updated_at timestamptz not null default now(),
  unique(character_id, item_id)
);

create table if not exists public.character_equipment (
  character_id uuid not null references public.characters(id) on delete cascade,
  slot text not null check (slot in ('weapon', 'head', 'body', 'legs', 'feet')),
  item_id text,
  updated_at timestamptz not null default now(),
  primary key(character_id, slot)
);

create table if not exists public.character_skills (
  character_id uuid not null references public.characters(id) on delete cascade,
  skill_id text not null,
  skill_level integer not null default 1 check (skill_level between 1 and 100),
  learned_at timestamptz not null default now(),
  primary key(character_id, skill_id)
);

create table if not exists public.character_quests (
  character_id uuid not null references public.characters(id) on delete cascade,
  quest_id text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'claimed')),
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(character_id, quest_id)
);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists characters_user_id_idx on public.characters(user_id);
create index if not exists inventory_character_idx on public.inventory_stacks(character_id);
create index if not exists chat_created_at_idx on public.chat_messages(created_at desc);

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.inventory_stacks enable row level security;
alter table public.character_equipment enable row level security;
alter table public.character_skills enable row level security;
alter table public.character_quests enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: signed-in users can read public display names; only owners edit.
drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles for select to authenticated using (true);

drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Characters: owners can read/create/update/delete only their own character.
drop policy if exists "Owners manage their character" on public.characters;
create policy "Owners manage their character"
on public.characters for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Child records are accessible only when their character belongs to the caller.
drop policy if exists "Owners manage inventory" on public.inventory_stacks;
create policy "Owners manage inventory"
on public.inventory_stacks for all to authenticated
using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists "Owners manage equipment" on public.character_equipment;
create policy "Owners manage equipment"
on public.character_equipment for all to authenticated
using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists "Owners manage skills" on public.character_skills;
create policy "Owners manage skills"
on public.character_skills for all to authenticated
using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

drop policy if exists "Owners manage quests" on public.character_quests;
create policy "Owners manage quests"
on public.character_quests for all to authenticated
using (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.characters c where c.id = character_id and c.user_id = auth.uid()));

-- Chat: authenticated users can read and send messages as themselves.
drop policy if exists "Authenticated users read chat" on public.chat_messages;
create policy "Authenticated users read chat"
on public.chat_messages for select to authenticated using (true);

drop policy if exists "Users send chat as themselves" on public.chat_messages;
create policy "Users send chat as themselves"
on public.chat_messages for insert to authenticated with check (auth.uid() = user_id);

-- No client UPDATE/DELETE policies for chat. Moderation/server tools can be added later.

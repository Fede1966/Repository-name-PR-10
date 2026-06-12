create table if not exists public.players (
  id text primary key,
  name text not null,
  number integer not null,
  birthdate date not null,
  position text not null,
  laterality text not null default 'Diestro',
  photo text default '',
  photo_path text default '',
  profile_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.players add column if not exists photo_path text default '';
alter table public.players add column if not exists profile_data jsonb not null default '{}'::jsonb;

create table if not exists public.matches (
  id text primary key,
  round integer not null,
  home text not null,
  away text not null,
  date date,
  status text not null default 'Preparación',
  score text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.lineups (
  match_id text primary key references public.matches(id) on delete cascade,
  lineup jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_plans (
  match_id text primary key references public.matches(id) on delete cascade,
  offensive_text text not null default '',
  defensive_text text not null default '',
  offensive_videos jsonb not null default '[]'::jsonb,
  defensive_videos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.lineups enable row level security;
alter table public.game_plans enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.players to anon;
grant select, insert, update, delete on public.matches to anon;
grant select, insert, update, delete on public.lineups to anon;
grant select, insert, update, delete on public.game_plans to anon;

drop policy if exists "Allow anon read players" on public.players;
drop policy if exists "Allow anon write players" on public.players;
drop policy if exists "Allow anon insert players" on public.players;
drop policy if exists "Allow anon update players" on public.players;
drop policy if exists "Allow anon delete players" on public.players;
drop policy if exists "Allow anon read matches" on public.matches;
drop policy if exists "Allow anon write matches" on public.matches;
drop policy if exists "Allow anon insert matches" on public.matches;
drop policy if exists "Allow anon update matches" on public.matches;
drop policy if exists "Allow anon delete matches" on public.matches;
drop policy if exists "Allow anon read lineups" on public.lineups;
drop policy if exists "Allow anon write lineups" on public.lineups;
drop policy if exists "Allow anon insert lineups" on public.lineups;
drop policy if exists "Allow anon update lineups" on public.lineups;
drop policy if exists "Allow anon delete lineups" on public.lineups;
drop policy if exists "Allow anon read game plans" on public.game_plans;
drop policy if exists "Allow anon write game plans" on public.game_plans;
drop policy if exists "Allow anon insert game plans" on public.game_plans;
drop policy if exists "Allow anon update game plans" on public.game_plans;
drop policy if exists "Allow anon delete game plans" on public.game_plans;

create policy "Allow anon read players" on public.players for select to anon using (true);
create policy "Allow anon insert players" on public.players for insert to anon with check (true);
create policy "Allow anon update players" on public.players for update to anon using (true) with check (true);
create policy "Allow anon delete players" on public.players for delete to anon using (true);

create policy "Allow anon read matches" on public.matches for select to anon using (true);
create policy "Allow anon insert matches" on public.matches for insert to anon with check (true);
create policy "Allow anon update matches" on public.matches for update to anon using (true) with check (true);
create policy "Allow anon delete matches" on public.matches for delete to anon using (true);

create policy "Allow anon read lineups" on public.lineups for select to anon using (true);
create policy "Allow anon insert lineups" on public.lineups for insert to anon with check (true);
create policy "Allow anon update lineups" on public.lineups for update to anon using (true) with check (true);
create policy "Allow anon delete lineups" on public.lineups for delete to anon using (true);

create policy "Allow anon read game plans" on public.game_plans for select to anon using (true);
create policy "Allow anon insert game plans" on public.game_plans for insert to anon with check (true);
create policy "Allow anon update game plans" on public.game_plans for update to anon using (true) with check (true);
create policy "Allow anon delete game plans" on public.game_plans for delete to anon using (true);

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow anon read player photos" on storage.objects;
drop policy if exists "Allow anon upload player photos" on storage.objects;
drop policy if exists "Allow anon update player photos" on storage.objects;
drop policy if exists "Allow anon delete player photos" on storage.objects;

create policy "Allow anon read player photos"
on storage.objects for select to anon
using (bucket_id = 'player-photos');

create policy "Allow anon upload player photos"
on storage.objects for insert to anon
with check (bucket_id = 'player-photos');

create policy "Allow anon update player photos"
on storage.objects for update to anon
using (bucket_id = 'player-photos')
with check (bucket_id = 'player-photos');

create policy "Allow anon delete player photos"
on storage.objects for delete to anon
using (bucket_id = 'player-photos');

notify pgrst, 'reload schema';

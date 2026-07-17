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
grant usage on schema public to authenticated;
grant select on public.players, public.matches, public.lineups, public.game_plans to anon;
grant select, insert, update, delete on public.players, public.matches, public.lineups, public.game_plans to authenticated;

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
drop policy if exists "Allow authenticated insert players" on public.players;
drop policy if exists "Allow authenticated update players" on public.players;
drop policy if exists "Allow authenticated delete players" on public.players;
drop policy if exists "Allow authenticated insert matches" on public.matches;
drop policy if exists "Allow authenticated update matches" on public.matches;
drop policy if exists "Allow authenticated delete matches" on public.matches;
drop policy if exists "Allow authenticated insert lineups" on public.lineups;
drop policy if exists "Allow authenticated update lineups" on public.lineups;
drop policy if exists "Allow authenticated delete lineups" on public.lineups;
drop policy if exists "Allow authenticated insert game plans" on public.game_plans;
drop policy if exists "Allow authenticated update game plans" on public.game_plans;
drop policy if exists "Allow authenticated delete game plans" on public.game_plans;

create policy "Allow anon read players" on public.players for select to anon using (true);
create policy "Allow authenticated insert players" on public.players for insert to authenticated with check (true);
create policy "Allow authenticated update players" on public.players for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete players" on public.players for delete to authenticated using (true);

create policy "Allow anon read matches" on public.matches for select to anon using (true);
create policy "Allow authenticated insert matches" on public.matches for insert to authenticated with check (true);
create policy "Allow authenticated update matches" on public.matches for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete matches" on public.matches for delete to authenticated using (true);

create policy "Allow anon read lineups" on public.lineups for select to anon using (true);
create policy "Allow authenticated insert lineups" on public.lineups for insert to authenticated with check (true);
create policy "Allow authenticated update lineups" on public.lineups for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete lineups" on public.lineups for delete to authenticated using (true);

create policy "Allow anon read game plans" on public.game_plans for select to anon using (true);
create policy "Allow authenticated insert game plans" on public.game_plans for insert to authenticated with check (true);
create policy "Allow authenticated update game plans" on public.game_plans for update to authenticated using (true) with check (true);
create policy "Allow authenticated delete game plans" on public.game_plans for delete to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow anon read player photos" on storage.objects;
drop policy if exists "Allow anon upload player photos" on storage.objects;
drop policy if exists "Allow anon update player photos" on storage.objects;
drop policy if exists "Allow anon delete player photos" on storage.objects;
drop policy if exists "Allow authenticated upload player photos" on storage.objects;
drop policy if exists "Allow authenticated update player photos" on storage.objects;
drop policy if exists "Allow authenticated delete player photos" on storage.objects;

create policy "Allow anon read player photos"
on storage.objects for select to anon
using (bucket_id = 'player-photos');

create policy "Allow authenticated upload player photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'player-photos');

create policy "Allow authenticated update player photos"
on storage.objects for update to authenticated
using (bucket_id = 'player-photos')
with check (bucket_id = 'player-photos');

create policy "Allow authenticated delete player photos"
on storage.objects for delete to authenticated
using (bucket_id = 'player-photos');

notify pgrst, 'reload schema';

/******
 * HELPER FUNCTIONS
 ******/
CREATE OR REPLACE FUNCTION generate_uid(size INT) RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  bytes BYTEA := gen_random_bytes(size);
  l INT := length(characters);
  i INT := 0;
  output TEXT := '';
BEGIN
  WHILE i < size LOOP
    output := output || substr(characters, get_byte(bytes, i) % l + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN output;
END;
$$ LANGUAGE plpgsql VOLATILE;

/******
 * CREATE TABLES
 ******/
create table public.users (
  id bigint not null,
  created_at timestamp with time zone not null default now(),
  first_name text null,
  last_name text null,
  username text null,
  constraint users_pkey primary key (id),
  constraint users_id_key unique (id)
);
alter table public.users enable row level security;

create table public.events (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  code text not null default generate_uid (10),
  constraint events_pkey primary key (id),
  constraint events_code_key unique (code)
);
alter table public.events enable row level security;

create type public.session_status as enum ('ACTIVE', 'COMPLETED');
-- TODO: cron that sets session to completed after 5mins of inactivity. 
create table public.sessions (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  event_id uuid not null,
  user_id bigint not null,
  status session_status not null default 'ACTIVE'::session_status,
  constraint sessions_pkey primary key (event_id, user_id),
  constraint sessions_event_id_fkey foreign key (event_id) references events (id) on update cascade,
  constraint sessions_user_id_fkey foreign key (user_id) references users (id) on update cascade
);
alter table public.sessions enable row level security;
-- Use partial index to create a unique constraint. Is that a good idea?
CREATE UNIQUE INDEX active_session_constraint ON public.sessions (user_id)
  WHERE (status = 'ACTIVE'::session_status);

/**
 * POSTGIS   
 */
create extension postgis with schema extensions;
create table public.locations (
  event_id uuid not null,
  user_id bigint not null,
  created_at timestamp with time zone not null,
  lat double precision not null,
  long double precision not null,
  location geography(POINT) not null, -- 'POINT(long lat)'
  -- TODO: store heading
  constraint locations_pkey primary key (event_id, user_id, created_at),
  constraint locations_event_id_fkey foreign key (event_id) references events (id) on update cascade,
  constraint locations_user_id_fkey foreign key (user_id) references users (id) on update cascade
);
alter table public.locations enable row level security;
create policy "Allow public read access" on public.locations for select using ( true );

-- RPC to insert data
CREATE OR REPLACE FUNCTION public.location_insert(_timestamp bigint, _lat double precision, _long double precision, _user_id bigint)
RETURNS void AS $$
declare active_event_id uuid;
begin
  select event_id into active_event_id from public.sessions where user_id = _user_id and status = 'ACTIVE'::session_status;

  INSERT INTO public.locations(event_id, user_id, created_at, lat, long, location)
  VALUES (active_event_id, _user_id, to_timestamp(_timestamp), _lat, _long, st_point(_long, _lat));
end;
$$ LANGUAGE plpgsql VOLATILE;

-- View to group locations into paths
-- TODO: make materilized view? https://supabase.com/blog/postgresql-views#what-is-a-materialized-view
-- Visualisation helper: https://arthur-e.github.io/Wicket/sandbox-gmaps3.html
create view location_paths as
  SELECT event_id, user_id, ST_MakeLine(location::geometry ORDER BY created_at) As path
	FROM locations
	GROUP BY event_id, user_id;

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */

begin; 
  -- remove the realtime publication
  drop publication if exists supabase_realtime; 

  -- re-create the publication but don't enable it for any tables
  create publication supabase_realtime;  
commit;

-- add tables to the publication
alter publication supabase_realtime add table public.locations;
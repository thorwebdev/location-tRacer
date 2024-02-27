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
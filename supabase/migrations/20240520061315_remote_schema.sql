alter table "public"."sessions" drop constraint "sessions_event_id_fkey";

alter table "public"."events" alter column "starting_at" set not null;

alter table "public"."sessions" add constraint "sessions_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) not valid;

alter table "public"."sessions" validate constraint "sessions_event_id_fkey";



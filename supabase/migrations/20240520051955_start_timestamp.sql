alter table public.events
  add starting_at timestamp with time zone default null;


create or replace view events_public as
  SELECT name, location_latlong, geojson_route, active, id, starting_at
	FROM events;
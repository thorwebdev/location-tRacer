alter table public.events
  add column active boolean default false;


create or replace view events_public as
  SELECT name, location_latlong, geojson_route, active, id
	FROM events;
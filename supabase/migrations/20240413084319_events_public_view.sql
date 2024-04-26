alter table public.events
  add column location_latlong double precision[], 
  add column geojson_route text;


create view events_public as
  SELECT name, location_latlong, geojson_route
	FROM events;
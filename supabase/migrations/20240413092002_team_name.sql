alter table public.sessions
  add column team_name text;

-- Update location_paths to output team_name.
create or replace view location_paths as
  SELECT l.event_id, l.user_id, 
    ST_MakeLine(l.location::geometry ORDER BY l.created_at) As path, 
    ST_AsGeoJSON(ST_MakeLine(l.location::geometry ORDER BY l.created_at)) As geojson,
    s.team_name
	from
    locations l
    join sessions s on l.user_id = s.user_id
	GROUP BY l.event_id, l.user_id, s.team_name;


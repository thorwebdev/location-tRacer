alter table public.sessions
  add column color varchar(7) default concat('#',lpad(to_hex(round(random() * 10000000)::int4),6,'0'));

-- Update location_paths to output color.
drop view if exists location_paths;
create or replace view location_paths as
  SELECT l.event_id, l.user_id, 
    ST_MakeLine(l.location::geometry ORDER BY l.created_at) As path, 
    ST_AsGeoJSON(ST_MakeLine(l.location::geometry ORDER BY l.created_at)) As geojson,
    s.team_name,
    s.color
	from
    locations l
    join sessions s on l.user_id = s.user_id
	GROUP BY l.event_id, l.user_id, s.team_name, s.color;


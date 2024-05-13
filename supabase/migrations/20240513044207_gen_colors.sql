-- Update location_paths to generate color.
create or replace view location_paths as
  SELECT l.event_id, l.user_id, 
    ST_MakeLine(l.location::geometry ORDER BY l.created_at) As path, 
    ST_AsGeoJSON(ST_MakeLine(l.location::geometry ORDER BY l.created_at)) as geojson,
    s.team_name,
    concat('#',lpad(to_hex(s.user_id),6,'0')) as color
	from
    locations l
    join sessions s on l.user_id = s.user_id
	GROUP BY l.event_id, l.user_id, s.team_name, s.user_id;
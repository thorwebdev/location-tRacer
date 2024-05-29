drop view if exists location_paths;
create or replace view location_paths as
  SELECT l.event_id, l.user_id, 
    ST_MakeLine(l.location::geometry ORDER BY l.created_at) As path, 
    ST_AsGeoJSON(ST_MakeLine(l.location::geometry ORDER BY l.created_at)) As geojson,
    s.team_name,
    s.color
	from
    locations l
    left join sessions s on l.event_id = s.event_id
    where l.user_id = s.user_id
	GROUP BY l.event_id, l.user_id, s.team_name, s.color;
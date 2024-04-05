-- Update location paths to output as geojson for easy renderin on map
create or replace view location_paths as
  SELECT event_id, user_id, 
    ST_MakeLine(location::geometry ORDER BY created_at) As path, 
    ST_AsGeoJSON(ST_MakeLine(location::geometry ORDER BY created_at)) As geojson
	FROM locations
	GROUP BY event_id, user_id;
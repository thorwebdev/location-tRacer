```bash
supabase functions serve --no-verify-jwt --env-file .env
ngrok http 53421
set telegram API webhook: https://api.telegram.org/bot<your_bot_token>/setWebhook?url=https://<your_ngrok_domain>.ngrok-free.app/functions/v1/telegram-bot?secret=<your_function_secret>

supabase gen types typescript --local --schema=public > supabase/functions/_shared/database.types.ts
```

## Bot commands

start - Start tracking an event.
stop - Stop the currently active event.
events - List your events.
update - Update your (team) name.

## Generate types

```bash
# For supabase functions
supabase gen types typescript --linked > supabase/functions/_shared/database.types.ts
# For nextjs app
supabase gen types typescript --linked > app/utils/database.types.ts
```

## Deploy

```bash
supabase link
supabase db push
supabase functions deploy telegram-bot --no-verify-jwt
supabase secrets set --env-file .env
```

## Useful SQL snippets

### Convert path into WKT

```sql
select event_id, user_id, ST_AsText(path) from location_paths;
```

### Calculate path distance in meters

```sql
select event_id, user_id, ST_Length(path::geography) from location_paths;
```

### Min max timestamp & duration

- duration is interval data type: https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-interval/

```sql
with stats as (
  SELECT DATE(created_at) as date, event_id, user_id, min(created_at), max(created_at), max(created_at) - min(created_at) as duration
    FROM locations
    GROUP BY DATE(created_at), event_id, user_id
)
select date, event_id, user_id,
EXTRACT(HOUR FROM duration) AS hours,
EXTRACT(MINUTE FROM duration) AS minutes,
EXTRACT(SECOND FROM duration) AS seconds,
EXTRACT(EPOCH FROM duration) AS epoch -- duration in seconds
from stats;
```

### Calculate average speed

```sql
with stats as (
  SELECT DATE(created_at) as date, event_id, user_id, min(created_at), max(created_at), max(created_at) - min(created_at) as duration, ST_Length(ST_MakeLine(location::geometry ORDER BY created_at)::geography) as distance
    FROM locations
    GROUP BY DATE(created_at), event_id, user_id
)
select date, event_id, user_id,
(distance / EXTRACT(EPOCH FROM duration)) as meters_per_second,
((distance / EXTRACT(EPOCH FROM duration)) * 3600) / 1000 as kmh
from stats;
```

## Generate Pmtiles

```bash
# Singapore Sentosa
# http://bboxfinder.com/#1.195877,103.788897,1.283919,103.906314
pmtiles extract https://build.protomaps.com/20240320.pmtiles singapore_oc.pmtiles --bbox=103.788897,1.195877,103.906314,1.283919
```

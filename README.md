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

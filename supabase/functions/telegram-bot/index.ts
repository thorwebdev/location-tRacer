import {
  Bot,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.20.3/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { Database } from "../_shared/database.types.ts";

const token = Deno.env.get("BOT_TOKEN");
if (!token) throw new Error("BOT_TOKEN is unset");

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const bot = new Bot(token);

bot.command("start", async (ctx) => {
  // Check if user exsist
  const user = ctx.update?.message?.from;
  if (!user) return;
  const { data, error } = await supabase.from("users").select().eq(
    "id",
    user.id,
  ).maybeSingle();
  if (error) console.log(`command:start:error: ${error.message}`);
  if (data) {
    return ctx.reply(
      `Welcome back ${data.username}! Please enter the official event code:`,
    );
  } else {
    // User doesn't exist, ask for password and create them:
    const { error } = await supabase.from("users").insert({
      id: user.id,
      username: user.username!,
      first_name: user.first_name,
      last_name: user.last_name,
    });
    if (error) {
      if (error) console.log(`command:start:insert:error: ${error.message}`);
      return ctx.reply("Sorry, there was an error, please try again!");
    } else {
      return ctx.reply(
        `Welcome ${user.username}! Please enter the official event code:`,
      );
    }
  }
});

bot.command("stop", async (ctx) => {
  const user = ctx.update?.message?.from;
  if (!user) return;
  const { data, error } = await supabase.from("sessions").update({
    status: "COMPLETED",
  }).eq("status", "ACTIVE").eq("user_id", user.id).select("events(name)")
    .single();
  if (error) {
    console.log(`update:session_status:error: ${error.message}`);
    return ctx.reply(`Sorry, something went wrong. Please try again!`);
  } else {
    return ctx.reply(`${data.events?.name} successfully completed!`);
  }
});

bot.command("events", async (ctx) => {
  // List user events
  const user = ctx.update?.message?.from;
  if (!user) return;
  const { data, error } = await supabase.from("sessions").select(
    "status, events(name, code)",
  ).eq("user_id", user.id).order("created_at");
  if (error) console.log(`sessions:list:error: ${error.message}`);
  if (data) {
    return ctx.reply(
      `
        Your active sessions:
        \n<b>CODE | NAME | STATUS</b>
          ${
        data.map((row) => (`
            \n${row.events?.code} | ${row.events?.name} | ${row.status}
          `))
      }
      `,
      { parse_mode: "HTML" },
    );
  } else {
    return ctx.reply(
      `You don't have any active events, please enter a event code!`,
    );
  }
});

bot.on("message", async (ctx) => {
  // Check for message or location.
  const { text, location, from: { id: user_id } } = ctx.update.message;
  if (text) {
    // Check event code
    const { data } = await supabase.from("events").select("id, name").eq(
      "code",
      text,
    ).single(); // TODO: check event date
    if (!data) {
      return ctx.reply(
        `Sorry, this event code doesn't exist. Please check with the event organizer!`,
      );
    }
    // Create event session for the user
    // TODO: only one active session per user
    const { error } = await supabase.from("sessions").insert({
      event_id: data.id,
      user_id,
    });
    if (error) {
      console.log(`session:insert:error: ${error.message}`);
      if (
        error.message ===
          'duplicate key value violates unique constraint "sessions_pkey"'
      ) {
        return ctx.reply(`
          You're already enrolled in ${data.name}!
          \n\nWhen you're ready, simply start sharing your live location here. 
          \n\nMake sure to select a duration long enough to cover the entire event!
          \n\nWhen finished, stop sharing your location and run the /stop command!
        `);
      }
      if (
        error.message ===
          'duplicate key value violates unique constraint "active_session_constraint"'
      ) {
        return ctx.reply(
          `You can only have one active event at a time. \nUse /events to see all your events. \nUse /stop to end the currently active event.`,
        );
      }
      return ctx.reply(
        `Sorry, there was an error adding you to the event. Please retry by running the /start command!`,
      );
    } else {
      return ctx.reply(`
        Welcome to ${data.name}!
        \n\nWhen you're ready, simply start sharing your live location here. 
        \n\nMake sure to select a duration long enough to cover the entire event!
        \n\nWhen finished, stop sharing your location and run the /stop command!
      `);
    }
  } else if (location) {
    // Check for active session
  } else return;
});
bot.on("edit:location", async (ctx) => {
  console.log("edit:location", JSON.stringify(ctx, null, 2));
});

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
  }
});

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
        data.map((
          row,
        ) => (`\n${row.events?.code} | ${row.events?.name} | ${row.status}`))
      }
      `.trim(),
      { parse_mode: "HTML" },
    );
  } else {
    return ctx.reply(
      `You don't have any active events, please enter an event code!`,
    );
  }
});

bot.command("update", async (ctx) => {
  const user = ctx.update?.message?.from;
  if (!user) return;
  const { error, data } = await supabase.from("sessions").update({
    team_name: null,
  }).match({ user_id: user.id, status: "ACTIVE" }).select("id");
  if (error) {
    console.log(`error:reset:username: ${error.message}`);
    return ctx.reply(
      `Sorry, there was an error, please try again!`,
    );
  } else if (data.length === 0) {
    return ctx.reply(
      `You don't have any active session. Please run the /start command.`,
    );
  }
  return ctx.reply(
    `Please send your (team) name:`,
  );
});

bot.on("message", async (ctx) => {
  // Check for message or location.
  const { text, location, from: { id: user_id, username }, date } =
    ctx.update.message;
  if (text) {
    // Check if user has active session
    const { data: session } = await supabase.from("sessions").select(
      "id, team_name, events(name)",
    ).match({ "user_id": user_id, status: "ACTIVE" }).single();
    // check if team_name is null -> update name
    if (session && !session.team_name) {
      const { error } = await supabase.from("sessions").update({
        team_name: text,
      }).eq("id", session.id);
      if (error) {
        console.log(`session:update:team_name: ${error.message}`);
        return ctx.reply(
          `Sorry, there was an issue updating your (team) name. Please try again!`,
        );
      }
      return ctx.reply(`
          Your (team) name has been changed to ${text}.
          \n\nWhen you're ready, simply start sharing your live location here. 
          \n\nMake sure to select a duration long enough to cover the entire event!
          \n\nWhen finished, stop sharing your location and run the stop command!
        `);
    } else if (session) {
      return ctx.reply(`
          You're already enrolled in ${session.events?.name}!
          \n\nYour current (team) name is ${session.team_name}. To change it run the /update command.
          \n\nWhen you're ready, simply start sharing your live location here. 
          \n\nMake sure to select a duration long enough to cover the entire event!
          \n\nWhen finished, stop sharing your location and run the stop command!
        `);
    }
    // Check event code
    const { data } = await supabase.from("events").select("id, name").eq(
      "code",
      text,
    ).single(); // TODO: check event date / check if active event
    if (!data) {
      return ctx.reply(
        `Sorry, this event code doesn't exist. Please check with the event organizer!`,
      );
    }
    // Create event session for the user
    const { error } = await supabase.from("sessions").insert({
      event_id: data.id,
      user_id,
      team_name: username,
    });
    if (error) {
      console.log(`session:insert:error: ${error.message}`);
      if (
        error.message ===
          'duplicate key value violates unique constraint "active_session_constraint"'
      ) {
        return ctx.reply(
          `You can only have one active event at a time. \nUse /events to see all your events. \nUse stop to end the currently active event.`,
        );
      }
      return ctx.reply(
        `Sorry, there was an error adding you to the event. Please retry by running the /start command!`,
      );
    } else {
      return ctx.reply(`
        Welcome to ${data.name}!
        \n\nYour current (team) name is ${username}. To change it run the /update command. 
        \n\nWhen you're ready, simply start sharing your live location here. 
        \n\nMake sure to select a duration long enough to cover the entire event!
        \n\nWhen finished, stop sharing your location and run the stop command!
      `);
    }
  } else if (location) {
    // Insert into db
    const { error } = await supabase.rpc("location_insert", {
      _user_id: user_id,
      _lat: location.latitude,
      _long: location.longitude,
      _timestamp: date,
    });
    if (error) {
      if (
        error.message ===
          'null value in column "event_id" of relation "locations" violates not-null constraint'
      ) {
        return ctx.reply(
          `You don't have any active event! Please stop location sharing and run the /start command!`,
        );
      }
      console.log(`location:insert:error:user:${user_id}: ${error.message}`);
    } else {
      return ctx.reply(
        `Race tracking is on! Good luck!`,
      );
    }
  }
});
bot.on("edit:location", async (ctx) => {
  const { location, from: { id: user_id }, edit_date } = ctx.update
    .edited_message!;
  if (location) {
    // Insert into db
    const { error } = await supabase.rpc("location_insert", {
      _user_id: user_id,
      _lat: location.latitude,
      _long: location.longitude,
      _timestamp: edit_date,
    });
    if (
      error && error.message !==
        'null value in column "event_id" of relation "locations" violates not-null constraint' &&
      error.message !==
        'duplicate key value violates unique constraint "locations_pkey"'
    ) {
      return console.log(
        `edit:location:insert:error:user:${user_id}: ${error.message}`,
      );
    }
  }
  return;
});

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  const headers = req.headers;
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdate(req);
  } catch (err) {
    console.log(headers);
    console.error(err);
  }
  return new Response();
});

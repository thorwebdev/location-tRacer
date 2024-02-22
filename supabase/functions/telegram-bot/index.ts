import {
  Bot,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.20.3/mod.ts";

const token = Deno.env.get("BOT_TOKEN");
if (!token) throw new Error("BOT_TOKEN is unset");

const bot = new Bot(token);

bot.command("start", (ctx) => {
  console.log("command:start", JSON.stringify(ctx, null, 2));
  ctx.reply("Welcome! Up and running.");
});
bot.command("ping", (ctx) => ctx.reply(`Pong! ${new Date()} ${Date.now()}`));

bot.on("message", async (ctx) => {
  console.log("on:message", JSON.stringify(ctx, null, 2));
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

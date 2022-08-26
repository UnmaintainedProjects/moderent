/**
 * This file is part of Moderent.
 *
 * Moderent is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Moderent is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Afferto General Public License
 * along with Moderent.  If not, see <https://www.gnu.org/licenses/>.
 */

import { getLogChat, setLogChat, unsetLogChat } from "$db";
import { Context } from "$utils";
import { Composer } from "grammy/mod.ts";

const composer = new Composer<Context>();

export default composer;

composer.command("setlogchat", async (ctx) => {
  const logChatId = Number(ctx.message?.text.split(/\s/)[1]);
  if (isNaN(logChatId)) {
    await ctx.reply("Give me the log chat's ID.");
    return;
  }
  try {
    await setLogChat(ctx.chat.id, logChatId);
    await ctx.reply(`Set the log chat to ${logChatId}.`);
  } catch (err) {
    console.log(err);
  }
});

composer.command("logchat", async (ctx) => {
  const logChatId = await getLogChat(ctx.chat.id);
  await ctx.reply(
    logChatId == null ? "No log chat is set." : `The log chat is ${logChatId}.`,
  );
});

composer.command("unsetlogchat", async (ctx) => {
  const unset = await unsetLogChat(ctx.chat.id);
  await ctx.reply(unset ? "Removed the log chat." : "No log chat is set.");
});

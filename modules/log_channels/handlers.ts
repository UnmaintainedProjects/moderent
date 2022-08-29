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

import { getLogChannel, setLogChannel, unsetLogChannel } from "./database.ts";
import { withRights } from "../admin/utilities.ts";
import { Context } from "$utilities";
import { Composer, GrammyError } from "grammy";
import errors from "bot-api-errors" assert { type: "json" };

export const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights("owner");

filter.command("setlogchannel", rights, async (ctx) => {
  const logChannelId = Number(ctx.message?.text.split(/\s/)[1]);
  if (isNaN(logChannelId)) {
    await ctx.reply("Give me a channel ID.");
  } else {
    if (ctx.chat.id == logChannelId) {
      await ctx.reply("The channel ID cannot be this group's ID.");
    } else {
      try {
        const chat = await ctx.api.getChat(logChannelId);
        if (chat.type == "channel") {
          const administrators = await ctx.api.getChatAdministrators(
            logChannelId,
          );
          if (
            ctx.from &&
            administrators.map((v) => v.user.id).includes(ctx.from.id)
          ) {
            await setLogChannel(ctx.chat.id, logChannelId);
            await ctx.reply("Log channel updated.");
          } else {
            await ctx.reply("You are not an administrator of the provided channel.");
          }
        } else {
          await ctx.reply("The ID is not a channel ID.");
        }
      } catch (err) {
        if (
          err instanceof GrammyError &&
          [
            errors.BotIsNotAMemberOfTheChannelChat,
            errors.BotIsNotAMemberOfTheGroupChat,
            errors.BotIsNotAMemberOfTheSupergroupChat,
            errors.ChatNotFound,
          ].includes(err.description)
        ) {
          await ctx.reply("I can't reach this channel.");
        } else {
          throw err;
        }
      }
    }
  }
});

filter.command("logchannel", rights, async (ctx) => {
  const logChannelId = await getLogChannel(ctx.chat.id);
  await ctx.reply(
    logChannelId ? "No log channel is set." : `The log channel is ${logChannelId}.`,
  );
});

filter.command("unsetlogchannel", rights, async (ctx) => {
  const unset = await unsetLogChannel(ctx.chat.id);
  await ctx.reply(unset ? "The log channel was removed." : "No log chat is set.");
});

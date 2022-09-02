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

import { getSettings, updateSettings } from "$database";
import { Context, withRights } from "$utilities";
import { Composer, GrammyError } from "grammy";
import errors from "bot-api-errors" assert { type: "json" };

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights("owner");

filter.command("setlogchat", rights, async (ctx) => {
  const logChat = Number(ctx.message?.text.split(/\s/)[1]);
  if (isNaN(logChat)) {
    await ctx.reply("Give me a chat ID.");
  } else {
    if (ctx.chat.id == logChat) {
      await ctx.reply("The log chat cannot be this chat.");
    } else {
      try {
        const chat = await ctx.api.getChat(logChat);
        if (chat.type == "channel") {
          const administrators = await ctx.api.getChatAdministrators(
            logChat,
          );
          if (
            ctx.from &&
            administrators.map((v) => v.user.id).includes(ctx.from.id)
          ) {
            await updateSettings(ctx.chat.id, { logChat });
            await ctx.reply("Log chat updated.");
          } else {
            await ctx.reply("You are not an administrator of that channel.");
          }
        } else {
          await ctx.reply("The provided chat is not a channel.");
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
          await ctx.reply("I can't reach this chat.");
        } else {
          throw err;
        }
      }
    }
  }
});

filter.command("logchat", rights, async (ctx) => {
  const { logChat } = await getSettings(ctx.chat.id);
  await ctx.reply(
    logChat ? "No log chat is set." : `The log chat is ${logChat}.`,
  );
});

filter.command("unsetlogchat", rights, async (ctx) => {
  const unset = await updateSettings(ctx.chat.id, { logChat: null });
  await ctx.reply(unset ? "Removed the log chat." : "No log chat is set.");
});

export default composer;

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

import { getLogChat, setLogChat, unsetLogChat } from "$database";
import { Context, withRights } from "$utilities";
import { Composer, Filter, GrammyError } from "grammy";
import errors from "bot-api-errors" assert { type: "json" };

const composer = new Composer<Filter<Context, "message">>();

export default composer;

const rights = withRights("owner");

composer.command("setlogchat", rights, async (ctx) => {
  const logChatId = Number(ctx.message?.text.split(/\s/)[1]);
  if (isNaN(logChatId)) {
    await ctx.reply("Give me a chat ID.");
  } else {
    if (ctx.chat.id == logChatId) {
      await ctx.reply("The log chat cannot be this chat.");
    } else {
      try {
        const chat = await ctx.api.getChat(logChatId);
        if (chat.type == "channel") {
          const administrators = await ctx.api.getChatAdministrators(
            logChatId,
          );
          if (administrators.map((v) => v.user.id).includes(ctx.from.id)) {
            await setLogChat(ctx.chat.id, logChatId);
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

composer.command("logchat", rights, async (ctx) => {
  const logChatId = await getLogChat(ctx.chat.id);
  await ctx.reply(
    logChatId ? "No log chat is set." : `The log chat is ${logChatId}.`,
  );
});

composer.command("unsetlogchat", rights, async (ctx) => {
  const unset = await unsetLogChat(ctx.chat.id);
  await ctx.reply(unset ? "Removed the log chat." : "No log chat is set.");
});

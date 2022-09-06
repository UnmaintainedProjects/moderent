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

import { Context, withRights } from "$utilities";
import { getSettings, updateSettings } from "$database";
import { Composer, GrammyError } from "grammy";
import errors from "bot-api-errors" assert { type: "json" };

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights("owner");

filter.command("setlogchannel", rights, async (ctx) => {
  const logChannel = Number(ctx.msg.text.split(/\s/)[1]);
  if (isNaN(logChannel)) {
    await ctx.reply("Give me the channel\u2019s ID.");
  } else {
    try {
      const chat = await ctx.api.getChat(logChannel);
      if (chat.type == "channel") {
        const administrators = await ctx.api.getChatAdministrators(
          logChannel,
        );
        if (
          ctx.from &&
          administrators.map((v) => v.user.id).includes(ctx.from.id)
        ) {
          await updateSettings(ctx.chat.id, { logChannel });
          await ctx.reply("Log channel changed.");
        } else {
          await ctx.reply("Permission denied.");
        }
      } else {
        await ctx.reply("This ID does not belong to a channel.");
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
        await ctx.reply("I can\u2019t reach this chat.");
      } else {
        throw err;
      }
    }
  }
});

filter.command("logchannel", rights, async (ctx) => {
  const { logChannel } = await getSettings(ctx.chat.id);
  await ctx.reply(
    logChannel ? "No log channel is set." : `The log channel is ${logChannel}.`,
  );
});

filter.command("unsetlogchannel", rights, async (ctx) => {
  const unset = await updateSettings(ctx.chat.id, { logChannel: null });
  await ctx.reply(unset ? "Log channel removed." : "Log chanel is not set.");
});

export default composer;

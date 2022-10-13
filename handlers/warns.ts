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

import {
  Context,
  getRestrictionParameters,
  logRestrictionEvent,
  withRights,
} from "$utilities";
import { fmt, mentionUser } from "grammy_parse_mode";
import { Composer } from "grammy";
import { getSettings, warn } from "../database/mod.ts";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights("can_restrict_members");

filter.command("warn", rights, async (ctx) => {
  const { user, reason } = getRestrictionParameters(ctx, true);
  if (!user) {
    await ctx.reply("Target not specified.");
    return;
  } else if (user == ctx.msg.reply_to_message?.from?.id && ctx.msg.reply_to_message.from.is_bot) {
    await ctx.reply("Can\u2019t warn bots.")
    return
  } else if (ctx.session.admins.has(user)) {
    await ctx.reply("Can\u2019t warn admins.")
    return
  }
  const warns = await warn(user, ctx.chat.id);
  const warnLimit = (await getSettings(ctx.chat.id))?.warnLimit ?? 3;
  logRestrictionEvent(
    ctx,
    `WARN ${warns}/${warnLimit}`,
    ctx.from,
    user,
    `Reason: ${reason ?? "Unspecified"}`,
  );
  if (warns == warnLimit) {
    await ctx.banChatMember(user);
    logRestrictionEvent(
      ctx,
      "BAN",
      ctx.from,
      user,
      `Warn limit reached (${warnLimit})`,
    );
  }
  await ctx.replyFmt(
    fmt`${mentionUser(user, user)} was warned${
      reason ? ` for:\n${reason}\n\n` : ". "
    }${
      warns == warnLimit
        ? fmt`This was the last warn. ${mentionUser(user, user)} was banned.`
        : `This is the ${warns}${
          warns == 1 ? "st" : warns == 2 ? "nd" : warns == 3 ? "rd" : "st"
        } warn.`
    }`,
  );
});

export default composer;

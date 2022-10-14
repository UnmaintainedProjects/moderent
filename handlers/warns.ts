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

import { getSettings, getWarns, rmwarn, updateSettings, warn } from "$database";
import {
  Context,
  getRestrictionParameters,
  logRestrictionEvent,
  withRights,
} from "$utilities";
import { fmt, mentionUser } from "grammy_parse_mode";
import { Composer } from "grammy";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights("can_restrict_members");
const rights2 = withRights(["can_change_info", "can_restrict_members"]);

filter.command(["warn", "dwarn", "swarn"], rights, async (ctx) => {
  const { user, reason } = getRestrictionParameters(ctx, true);
  if (!user) {
    await ctx.reply("Target not specified.");
    return;
  } else if (
    ctx.session.admins.has(user) ||
    user == ctx.msg.reply_to_message?.from?.id &&
      ctx.msg.reply_to_message.from.is_bot
  ) {
    await ctx.reply("Can\u2019t warn admins or bots.");
    return;
  }
  const command = ctx.msg.text.slice(1, ctx.msg.entities[0].length);
  if (command == "dwarn" && ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  } else if (command == "swarn") {
    await ctx.deleteMessage();
  }
  const warns = await warn(user, ctx.chat.id);
  const warnLimit = (await getSettings(ctx.chat.id)).warnLimit;
  logRestrictionEvent(
    ctx,
    `WARN ${warns}/${warnLimit}`,
    ctx.from,
    user,
    `Reason: ${reason ?? "Unspecified"}`,
  );
  if (warns == warnLimit) {
    await ctx.banChatMember(user);
    await rmwarn(user, ctx.chat.id, true);
    logRestrictionEvent(
      ctx,
      "BAN",
      ctx.from,
      user,
      "Reason: Warn limit reached",
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

filter.command("rmwarn", rights, async (ctx) => {
  const { user, reason } = getRestrictionParameters(ctx, true);
  if (!user) {
    await ctx.reply("Target not specified.");
    return;
  } else if (
    ctx.session.admins.has(user) ||
    user == ctx.msg.reply_to_message?.from?.id &&
      ctx.msg.reply_to_message.from.is_bot
  ) {
    await ctx.reply("Can\u2019t warn admins or bots.");
    return;
  }
  if (await rmwarn(user, ctx.chat.id)) {
    logRestrictionEvent(
      ctx,
      "RMWARN",
      ctx.from,
      user,
      `Reason: ${reason ?? "Unspecified"}`,
    );
    await ctx.replyFmt(
      fmt`Removed ${mentionUser(user, user)}\u2019s last warning.`,
    );
  } else {
    await ctx.replyFmt(fmt`${mentionUser(user, user)} has no warnings.`);
  }
});

filter.command("resetwarn", rights, async (ctx) => {
  const { user, reason } = getRestrictionParameters(ctx, true);
  if (!user) {
    await ctx.reply("Target not specified.");
    return;
  } else if (
    ctx.session.admins.has(user) ||
    user == ctx.msg.reply_to_message?.from?.id &&
      ctx.msg.reply_to_message.from.is_bot
  ) {
    await ctx.reply("Can\u2019t warn admins or bots.");
    return;
  }
  if (await rmwarn(user, ctx.chat.id, true)) {
    logRestrictionEvent(
      ctx,
      "RESETWARN",
      ctx.from,
      user,
      `Reason: ${reason ?? "Unspecified"}`,
    );
    await ctx.replyFmt(
      fmt`Removed ${mentionUser(user, user)}\u2019s warnings.`,
    );
  } else {
    await ctx.replyFmt(fmt`${mentionUser(user, user)} has no warnings.`);
  }
});

filter.command("warns", rights, async (ctx) => {
  const { user } = getRestrictionParameters(ctx, true);
  if (!user) {
    await ctx.reply("Target not specified.");
    return;
  } else if (
    ctx.session.admins.has(user) ||
    user == ctx.msg.reply_to_message?.from?.id &&
      ctx.msg.reply_to_message.from.is_bot
  ) {
    await ctx.reply("Can\u2019t warn admins or bots.");
    return;
  }
  const warns = await getWarns(user, ctx.chat.id);
  await ctx.replyFmt(
    `${mentionUser(user, user)} has ${warns} warn${warns == 1 ? "" : "s"}.`,
  );
});

filter.command("warnlimit", rights2, async (ctx) => {
  const warnLimit = Number(ctx.msg.text.split(/\s/));
  if (isNaN(warnLimit)) {
    await ctx.reply("Invalid limit specified.");
    return;
  } else if (warnLimit < 2) {
    await ctx.reply("Warn limit cannot be less than 2.");
    return;
  } else if (warnLimit > 10) {
    await ctx.reply("Warn limit cannot be more than 10.");
    return;
  }
  if (await updateSettings(ctx.chat.id, { warnLimit })) {
    await ctx.reply("Warn limit changed.");
  } else {
    await ctx.reply("Warn limit was not changed.");
  }
});

export default composer;

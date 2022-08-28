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

import { logRestrictionEvent } from "../log_chats/logging.ts";
import { Context, getRestrictionParameters, withRights } from "$utilities";
import { Composer } from "grammy";
import { fmt, mentionUser } from "grammy_parse_mode";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights("can_restrict_members");
const rights2 = withRights(["can_restrict_members", "can_delete_messages"]);


filter.command("ban", rights, async (ctx) => {
  const params = getRestrictionParameters(ctx);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  logRestrictionEvent(ctx, "BAN", ctx.from, params.user, params.reason);
  await ctx.replyFmt(
    fmt`Banned ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate}.`,
  );
});

filter.command("unban", rights, async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.unbanChatMember(params.user);
  logRestrictionEvent(ctx, "UNBAN", ctx.from, params.user, params.reason);
  await ctx.replyFmt(fmt`Unbanned ${mentionUser(params.user, params.user)}.`);
});

filter.command("dban", rights2, async (ctx) => {
  const params = getRestrictionParameters(ctx);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  logRestrictionEvent(ctx, "BAN", ctx.from, params.user, params.reason);
  await ctx.deleteMessage();
  if (ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  }
});

filter.command("kick", rights, async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  await new Promise((r) => setTimeout(r, 1000));
  await ctx.unbanChatMember(params.user);
  logRestrictionEvent(ctx, "KICK", ctx.from, params.user, params.reason);
  await ctx.replyFmt(
    fmt`Kicked ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate}.`,
  );
});

filter.command("dkick", rights2, async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  await new Promise((r) => setTimeout(r, 1000));
  await ctx.unbanChatMember(params.user);
  logRestrictionEvent(ctx, "KICK", ctx.from, params.user, params.reason);
  if (ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  }
});

filter.command("mute", rights, async (ctx) => {
  const params = getRestrictionParameters(ctx);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.restrictChatMember(params.user, { can_send_messages: false }, {
    until_date: params.untilDate,
  });
  logRestrictionEvent(ctx, "MUTE", ctx.from, params.user, params.reason);
  await ctx.replyFmt(
    fmt`Muted ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate}.`,
  );
});

filter.command("unmute", rights, async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.restrictChatMember(params.user, {
    can_send_polls: true,
    can_change_info: true,
    can_invite_users: true,
    can_pin_messages: true,
    can_send_messages: true,
    can_send_media_messages: true,
    can_send_other_messages: true,
    can_add_web_page_previews: true,
  });
  logRestrictionEvent(ctx, "UNMUTE", ctx.from, params.user, params.reason);
  await ctx.replyFmt(`Unmuted ${mentionUser(params.user, params.user)}.`);
});

filter.command("dmute", rights, async (ctx) => {
  const params = getRestrictionParameters(ctx);
  if (!params.user) {
    await ctx.reply("Target not specified.");
    return;
  }
  await ctx.restrictChatMember(params.user, { can_send_messages: false }, {
    until_date: params.untilDate,
  });
  logRestrictionEvent(ctx, "MUTE", ctx.from, params.user, params.reason);
  await ctx.deleteMessage();
  if (ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  }
});

export {composer};
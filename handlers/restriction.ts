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
  getTarget,
  log,
  RestrictionParameters,
  revertAction,
  withRights,
} from "$utilities";

import { Composer, InlineKeyboard } from "grammy";
import { Chat, User } from "grammy/types.ts";
import { fmt, mentionUser } from "grammy_parse_mode";

const composer = new Composer<Context>();

export default composer;

const message = composer.on(["message", "callback_query"]);

const canRestrict = message.use(withRights("can_restrict_members"));
const canRestrictAndDelete = message.use(
  withRights(["can_restrict_members", "can_delete_messages"]),
);

function logBan(
  params: RestrictionParameters,
  ctx: Context & { chat: Chat; from: User },
) {
  log(
    fmt`${mentionUser(ctx.from.first_name, ctx.from.id)} banned ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate ? `${params.readableUntilDate}` : ""} ${
      params.reason
        ? `for the following reason:\n${params.reason}`
        : "for no reason."
    }`,
    ctx,
  );
}

canRestrict.command("ban", async (ctx) => {
  const params = getRestrictionParameters(ctx);
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  logBan(params, ctx);
  await ctx.replyFmt(
    fmt`Banned ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate}.`,
    {
      reply_markup: new InlineKeyboard().text("Undo", "unban"),
    },
  );
});

function logUnban(
  objOrParams: RestrictionParameters | number,
  ctx: Context & { chat: Chat; from: User },
) {
  const target = typeof objOrParams == "number"
    ? objOrParams
    : objOrParams.user;
  log(
    fmt`${mentionUser(ctx.from.first_name, ctx.from.id)} unbanned ${
      mentionUser(target, target)
    } ${
      typeof objOrParams == "number"
        ? "(revert)."
        : objOrParams.reason
        ? `for the following reason:\n${objOrParams.reason}`
        : "for no reason."
    }`,
    ctx,
  );
}

canRestrict.command("unban", async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  await ctx.unbanChatMember(params.user);
  logUnban(params, ctx);
  await ctx.replyFmt(fmt`Unbanned ${mentionUser(params.user, params.user)}.`);
});

canRestrict.filter((ctx): ctx is typeof ctx & { chat: Chat } => !!ctx.chat)
  .callbackQuery("unban", async (ctx) => {
    const target = getTarget(ctx);
    if (target) {
      await revertAction(ctx, () => ctx.unbanChatMember(target));
      logUnban(target, ctx);
    }
  });

canRestrictAndDelete.command("dban", async (ctx) => {
  const params = getRestrictionParameters(ctx);
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  logBan(params, ctx);
  await ctx.deleteMessage();
  if (ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  }
});

function logKick(
  params: RestrictionParameters,
  ctx: Context & { chat: Chat; from: User },
) {
  log(
    fmt`${mentionUser(ctx.from.first_name, ctx.from.id)} kicked ${
      mentionUser(params.user, params.user)
    } ${
      params.reason
        ? `for the following reason:\n${params.reason}`
        : "for no reason."
    }`,
    ctx,
  );
}

canRestrict.command("kick", async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  await new Promise((r) => setTimeout(r, 1000));
  await ctx.unbanChatMember(params.user);
  logKick(params, ctx);
  await ctx.replyFmt(
    fmt`Kicked ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate}.`,
  );
});

canRestrictAndDelete.command("dkick", async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  await ctx.banChatMember(params.user, { until_date: params.untilDate });
  await new Promise((r) => setTimeout(r, 1000));
  await ctx.unbanChatMember(params.user);
  logKick(params, ctx);
  if (ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  }
});

const mute = { can_send_messages: false };

const unmute = {
  can_send_polls: true,
  can_change_info: true,
  can_invite_users: true,
  can_pin_messages: true,
  can_send_messages: true,
  can_send_media_messages: true,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
};

canRestrict.command("mute", async (ctx) => {
  const params = getRestrictionParameters(ctx);
  await ctx.restrictChatMember(params.user, mute, {
    until_date: params.untilDate,
  });
  await ctx.replyFmt(
    fmt`Muted ${
      mentionUser(params.user, params.user)
    }${params.readableUntilDate}.`,
    {
      reply_markup: new InlineKeyboard().text("Undo", "unmute"),
    },
  );
});

canRestrict.command("unmute", async (ctx) => {
  const params = getRestrictionParameters(ctx, true);
  await ctx.restrictChatMember(params.user, unmute);
  await ctx.replyFmt(`Unmuted ${mentionUser(params.user, params.user)}.`);
});

canRestrict.callbackQuery("unmute", async (ctx) => {
  const target = getTarget(ctx);
  if (target) {
    await revertAction(ctx, () => ctx.restrictChatMember(target, unmute));
  }
});

canRestrictAndDelete.command("dmute", async (ctx) => {
  const params = getRestrictionParameters(ctx);
  await ctx.restrictChatMember(params.user, mute, {
    until_date: params.untilDate,
  });
  await ctx.deleteMessage();
  if (ctx.msg.reply_to_message) {
    await ctx.api.deleteMessage(
      ctx.chat.id,
      ctx.msg.reply_to_message.message_id,
    );
  }
});

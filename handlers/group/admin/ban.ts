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
} from "$utils";

import { Composer, InlineKeyboard } from "grammy/mod.ts";
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

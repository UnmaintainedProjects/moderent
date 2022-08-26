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
  log,
  RestrictionParameters,
  withRights,
} from "$utils";

import { Composer } from "grammy/mod.ts";
import { Chat, User } from "grammy/types.ts";
import { fmt, mentionUser } from "grammy_parse_mode";

const composer = new Composer<Context>();

export default composer;

const message = composer.on(["message", "callback_query"]);

const canRestrict = message.use(withRights("can_restrict_members"));
const canRestrictAndDelete = message.use(
  withRights(["can_restrict_members", "can_delete_messages"]),
);

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
    {
      parse_mode: "MarkdownV2",
    },
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

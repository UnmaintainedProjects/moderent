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
  revertAction,
  withRights,
} from "$utils";

import { Composer, InlineKeyboard } from "grammy/mod.ts";
import { fmt, mentionUser } from "grammy_parse_mode";

const composer = new Composer<Context>();

export default composer;

const message = composer.on(["message", "callback_query"]);

const canRestrict = message.use(withRights("can_restrict_members"));
const canRestrictAndDelete = message.use(
  withRights(["can_restrict_members", "can_delete_messages"]),
);

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

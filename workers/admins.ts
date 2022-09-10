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

import { Context, logChatEvent, logRestrictionEvent } from "$utilities";
import { ChatMemberAdministrator, ChatMemberOwner } from "grammy/types.ts";
import { Composer } from "grammy";
import {
  fmt,
  mentionUser,
} from "https://deno.land/x/grammy_parse_mode@1.4.0/format.ts";

const composer = new Composer<Context>();

export default composer;

const filter = composer.chatType("supergroup");

filter.use(async (ctx, next) => {
  if (ctx.session.admins.size == 0) {
    (await ctx.getChatAdministrators()).filter((
      v,
    ): v is ChatMemberOwner | ChatMemberAdministrator =>
      v.status == "creator" || v.status == "administrator"
    ).forEach((v) => ctx.session.admins.set(v.user.id, v));
  }
  await next();
});

filter.on("chat_member", (ctx) => {
  const newMember = ctx.chatMember.new_chat_member;
  const oldMember = ctx.chatMember.old_chat_member;
  const { user } = newMember;
  if (ctx.from.id != ctx.me.id) {
    if (oldMember.status == "kicked" && newMember.status != "kicked") {
      logRestrictionEvent(ctx, "UNBAN", ctx.from, user);
    } else if (newMember.status == "kicked") {
      logRestrictionEvent(ctx, "BAN", ctx.from, user);
    } else if (newMember.status == "administrator") {
      logRestrictionEvent(ctx, "PROMOTE", ctx.from, user);
    } else if (newMember.status == "left") {
      logChatEvent(
        ctx,
        "LEAVE",
        fmt`User: ${
          mentionUser(
            user.first_name + (user.last_name ? " " + user.last_name : "") +
              (user.username ? ` (@${user.username})` : ""),
            user.id,
          )
        }`,
      );
    } else if (newMember.status == "restricted") {
      logRestrictionEvent(
        ctx,
        "RESTRICT",
        ctx.from,
        user,
        Object.entries(newMember)
          .filter(([k]) => k.startsWith("can_"))
          .map(
            ([k, v]) => [
              k.replace(
                /[a-z][a-z]+(_|$)/g,
                (s) => s[0].toUpperCase() + s.slice(1).replace(/_/g, "") + " ",
              ).trim(),
              v ? "Yes" : "No",
            ],
          )
          .map((v) => v.join(": "))
          .join("\n"),
      );
    } else if (
      oldMember.status == "restricted" && newMember.status == "member"
    ) {
      logRestrictionEvent(ctx, "DERESTRICT", ctx.from, user);
    }
  }
  if (newMember.status == "creator" || newMember.status == "administrator") {
    ctx.session.admins.set(user.id, newMember);
  } else if (ctx.session.admins.has(user.id)) {
    ctx.session.admins.delete(user.id);
  }
});

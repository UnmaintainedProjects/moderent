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

import { Context } from "$utilities";
import { ChatMemberAdministrator, ChatMemberOwner } from "grammy/types.ts";
import { Composer } from "grammy";

const composer = new Composer<Context>();

export default composer;

const filter = composer.chatType("supergroup");

filter.use(async (ctx, next) => {
  if (ctx.session.admins.size == 0) {
    (await ctx.getChatAdministrators())
      .filter((v): v is ChatMemberOwner | ChatMemberAdministrator =>
        v.status == "creator" || v.status == "administrator"
      )
      .forEach((v) => ctx.session.admins.set(v.user.id, v));
  }
  await next();
});

filter.on("chat_member", (ctx) => {
  const newMember = ctx.chatMember.new_chat_member;
  const { user } = newMember;
  if (newMember.status == "creator" || newMember.status == "administrator") {
    ctx.session.admins.set(user.id, newMember);
  } else if (ctx.session.admins.has(user.id)) {
    ctx.session.admins.delete(user.id);
  }
});

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
import { Composer } from "grammy";
import { ChatMemberAdministrator, ChatMemberOwner } from "grammy/types.ts";

const composer = new Composer<Context>();

export default composer;

composer.use(async (ctx, next) => {
  if (ctx.session.admins.size == 0) {
    (await ctx.getChatAdministrators()).filter((
      v,
    ): v is ChatMemberOwner | ChatMemberAdministrator =>
      v.status == "creator" || v.status == "administrator"
    ).forEach((v) => ctx.session.admins.set(v.user.id, v));
  }
  await next();
});

composer.on("chat_member", (ctx) => {
  const member = ctx.chatMember.new_chat_member;
  const { id } = member.user;
  if (member.status == "creator" || member.status == "administrator") {
    ctx.session.admins.set(id, member);
  } else if (ctx.session.admins.has(id)) {
    ctx.session.admins.delete(id);
  }
});

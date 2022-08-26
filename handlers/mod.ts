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

import moderation from "./moderation.ts";
import logChat from "./log_chat.ts";
import { Context } from "$utilities";
import { Composer } from "grammy";
import { Chat } from "grammy/types.ts";

const composer = new Composer<Context>();

export default composer;

const group = composer.filter((
  ctx,
): ctx is typeof ctx & { "chat": Chat.SupergroupChat | Chat.GroupChat } => {
  return !!ctx.chat?.type.endsWith("group");
});

group.filter((ctx) => !!ctx.from && ctx.session.admins.has(ctx.from.id))
  .use(moderation);

composer.filter((ctx) =>
  !!ctx.from && ctx.session.admins.get(ctx.from.id)?.status == "creator"
).use(logChat);

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

import { Context } from "$utils";
import { Composer } from "grammy/mod.ts";

import log_chats from "./log_chats.ts";

const composer = new Composer<Context>();

export default composer;

composer.use((ctx, next) => {
  if (ctx.from) {
    const rights = ctx.session.admins.get(ctx.from.id);
    if (rights?.status == "creator") {
      return next();
    }
  }
});

composer.use(log_chats);

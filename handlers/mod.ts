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

import logChat from "./log_chat.ts";
import messages from "./messages.ts";
import restrictions from "./restrictions.ts";
import { Context } from "$utilities";
import { Composer } from "grammy";
import { autoQuote } from "grammy_autoquote";

const composer = new Composer<Context>();

export default composer;

const group = composer.chatType(["group", "supergroup"]);

group.use(autoQuote);
group.use(messages);
group.use(restrictions);

group.filter((ctx) =>
  !!ctx.from && ctx.session.admins.get(ctx.from.id)?.status == "creator"
).use(logChat);

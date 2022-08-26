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

import { Context } from "./types.ts";
import { getLogChat } from "$db";

import { Chat } from "grammy/types.ts";
import { FormattedString } from "grammy_parse_mode";

export function log(text: FormattedString, ctx: Context & { chat: Chat }) {
  Promise.resolve().then(async () => {
    const logChat = await getLogChat(ctx.chat.id);
    if (logChat) {
      await ctx.api.sendMessage(logChat, text.toString(), {
        entities: text.entities,
      });
    }
  }).catch((err) => {
    console.error("failed to log an action", err);
  });
}

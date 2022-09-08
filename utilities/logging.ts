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
import { getSettings } from "$database";
import { User } from "grammy/types.ts";
import { ChatTypeContext } from "grammy";
import {
  fmt,
  FormattedString,
  mentionUser,
  Stringable,
} from "grammy_parse_mode";

type LogContext = ChatTypeContext<Context, "group" | "supergroup">;

export function log(ctx: LogContext, text: FormattedString) {
  Promise.resolve().then(async () => {
    const { logChannel } = await getSettings(ctx.chat.id);
    if (logChannel) {
      await ctx.api.sendMessage(logChannel, text.toString(), {
        entities: text.entities,
      });
    }
  }).catch((err) => {
    console.error("failed to log an action", err);
  });
}

export function logChatEvent(ctx: LogContext, type: string, other: Stringable) {
  log(ctx, fmt`#${type}\nChat: ${ctx.chat.title}\n${other}`);
}

export function logRestrictionEvent(
  ctx: LogContext,
  type: string,
  admin: User,
  target: number | User,
  other?: Stringable,
) {
  logChatEvent(
    ctx,
    type,
    fmt`Admin: ${mentionUser(admin.first_name, admin.id)}\nTarget: ${
      mentionUser(
        typeof target === "number" ? target : target.username ??
            target.first_name + target.last_name
          ? ` ${target.last_name}`
          : "",
        typeof target === "number" ? target : target.id,
      )
    }${other ? fmt`\n${other}` : ""}`,
  );
}

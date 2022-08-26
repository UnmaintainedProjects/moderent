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

import { Context, Session } from "./types.ts";
import { Middleware, session as session_ } from "grammy";
import { ChatAdministratorRights } from "grammy/types.ts";

export const session = session_({
  initial: (): Session => ({
    admins: new Map(),
  }),
});

export function withRights(
  requiredRights:
    | keyof ChatAdministratorRights
    | (keyof ChatAdministratorRights)[],
): Middleware<Context & { from: NonNullable<Context["from"]> }> {
  return async (ctx, next) => {
    const rights = ctx.session.admins.get(ctx.from.id);
    requiredRights = Array.isArray(requiredRights)
      ? requiredRights
      : [requiredRights];
    if (rights) {
      if (
        rights.status == "creator" || (
          rights.status == "administrator" &&
          requiredRights.map((v) => rights[v]).filter((v) => v).length ==
            requiredRights.length
        )
      ) {
        return next();
      }
    }
    const text = "Permission denied.";
    if (ctx.message) {
      await ctx.reply(text);
    } else if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text, show_alert: true });
    }
  };
}

export const withReply: Middleware<Context> = async (ctx, next) => {
  if (!ctx.message?.reply_to_message) {
    await ctx.reply("Reply a message.");
  } else {
    await next();
  }
};

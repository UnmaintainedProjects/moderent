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
import { getSettings } from "$database";
import { Composer, FilterQuery } from "grammy";

const composer = new Composer<Context>();

export default composer;

const filter = composer.chatType("supergroup");

const lockers: Record<
  string,
  (ctx: Context) => Promise<boolean> | boolean
> = {
  rtl(ctx) {
    ctx.message?.text ?? "" + ctx.message?.caption ?? "";
    return false;
  },
};

filter.use(async (ctx) => {
  if (
    !(ctx.from &&
      ctx.session.admins.has(ctx.from.id))
  ) {
    const { locks } = await getSettings(ctx.chat.id);
    if (locks) {
      for (const lock of locks) {
        const locker = lockers[lock];
        if (
          (locker && locker(ctx)) || (() => {
            try {
              return ctx.has(lock as FilterQuery);
            } catch (_err) {
              return false;
            }
          })()
        ) {
          await ctx.deleteMessage();
        }
      }
    }
  }
});

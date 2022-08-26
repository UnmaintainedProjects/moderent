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

import admin from "./admin/mod.ts";
import owner from "./owner/mod.ts";

import { Context, InputError, RightError } from "$utils";

import { Composer, GrammyError } from "grammy/mod.ts";
import { Chat } from "grammy/types.ts";

const composer = new Composer<Context>();

export default composer;

composer.use(owner);

const filter = composer.filter((
  ctx,
): ctx is typeof ctx & { "chat": Chat.SupergroupChat | Chat.GroupChat } =>
  !!ctx.chat?.type.endsWith("group")
).errorBoundary(async ({ ctx, error }) => {
  if (error instanceof InputError) {
    await ctx.reply(error.message);
  } else if (error instanceof RightError) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: "You can't do this.",
        show_alert: true,
      });
    } else {
      await ctx.reply(
        `You need the following right${
          error.requiredRights.length == 1 ? "" : "s"
        } to perform this action:\n` +
          error.requiredRights.join(", "),
      );
    }
  } else if (error instanceof GrammyError) {
    if (![400].includes(error.error_code)) {
      throw error;
    }
    const text = `A ${error.error_code} error occurred.`;
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text, show_alert: true });
    } else {
      await ctx.reply(text);
    }
  }
});

filter.use(admin);

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

import emojic, { emoji } from "./emoji.ts";
import { Context } from "$utilities";
import {
  CallbackQueryContext,
  Composer,
  InlineKeyboard,
  MiddlewareFn,
} from "grammy";
import { getSettings } from "$database";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const captchaHandlers: Record<
  string,
  MiddlewareFn<CallbackQueryContext<Context>>
> = { emoji };

composer.use(emojic);

composer.callbackQuery(/^captcha:([^:]+):([^:]+)$/, async (ctx, next) => {
  const type = ctx.match![0];
  const chatId = ctx.match![1];
  await ctx.editMessageReplyMarkup({
    reply_markup: new InlineKeyboard().text(
      "Start",
      chatId,
    ),
  });
  await captchaHandlers[type](ctx, next);
});

filter.on("chat_join_request", async (ctx) => {
  const { captcha } = await getSettings(ctx.chat.id);
  if (captcha) {
    await ctx.api.sendMessage(
      ctx.from.id,
      `Hi ${ctx.from.first_name}, you should solve a captcha to be accepted in ${ctx.chat.title}.`,
      {
        reply_markup: new InlineKeyboard().text(
          "Start",
          `captcha:${captcha}:${ctx.chat.id}`,
        ),
      },
    );
  }
});

export default composer;

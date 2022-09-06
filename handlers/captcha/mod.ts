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
import { Context, withRights } from "$utilities";
import {
  Captcha,
  getCaptchaState,
  getSettings,
  updateCaptchaState,
  updateSettings,
} from "$database";
import { code, fmt } from "grammy_parse_mode";
import {
  CallbackQueryContext,
  Composer,
  InlineKeyboard,
  MiddlewareFn,
} from "grammy";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights(["can_change_info", "can_invite_users"]);
const captchaHandlers: Record<
  string,
  MiddlewareFn<CallbackQueryContext<Context>>
> = { emoji };

composer.use(emojic);

composer.callbackQuery(/^captcha:([^:]+):([^:]+)$/, async (ctx, next) => {
  await ctx.answerCallbackQuery();
  const type = ctx.match![1];
  const chatId = ctx.match![2];
  const state = await getCaptchaState(ctx.chat!.id, Number(chatId));
  if (state) {
    await captchaHandlers[type](ctx, next);
    await ctx.editMessageReplyMarkup({
      reply_markup: new InlineKeyboard().text(
        "Start",
        chatId,
      ),
    });
  } else {
    await ctx.deleteMessage();
  }
});

filter.on("chat_join_request", async (ctx) => {
  const { captcha } = await getSettings(ctx.chat.id);
  if (captcha) {
    const state = await getCaptchaState(ctx.from.id, ctx.chat.id) ??
      {
        negotiated: false,
        joinRequest: new Date(ctx.chatJoinRequest.date * 1000),
      };
    if (
      !state.negotiated ||
      Date.now() - state.joinRequest.getTime() > 5 * 60 * 1000
    ) {
      await ctx.api.sendMessage(
        ctx.from.id,
        // this text is bound to the slice in ./emoji.ts:73
        `You should solve a CAPTCHA before you can join ${ctx.chat.title}.`,
        {
          reply_markup: new InlineKeyboard().text(
            "Start",
            `captcha:${captcha}:${ctx.chat.id}`,
          ),
        },
      );
      state.negotiated = true;
      await updateCaptchaState(ctx.from.id, ctx.chat.id, state);
    }
  }
});

filter.command("captcha", async (ctx) => {
  const { captcha } = await getSettings(ctx.chat.id);
  await ctx.reply(
    captcha ? `CAPTCHA is set to ${captcha}.` : "CAPTCHA is disabled.",
  );
});

filter.command("setcaptcha", rights, async (ctx) => {
  const type = ctx.message.text.split(/\s/)[1];
  if (!type) {
    await ctx.reply(
      "Pass one of the /captchatypes or \u201Coff\u201D to disable.",
    );
    return;
  }
  if (![...Object.values(Captcha), "off"].includes(type)) {
    await ctx.reply(`Unknown CAPTCHA type "${type}".`);
    return;
  }
  const result = await updateSettings(ctx.chat.id, {
    captcha: type == "off" ? null : type as Captcha,
  });
  await ctx.reply(
    result
      ? type == "off" ? "CAPTCHA disabled." : `CAPTCHA set to ${type}.`
      : type == "off"
      ? "CAPTCHA is already disabled."
      : `CAPTCHA is already set to ${type}.`,
  );
});

filter.command(
  "captchatypes",
  (ctx) => {
    const types = Object.values(Captcha);
    ctx.replyFmt(
      fmt`The available CAPTCHA types are:\n- ${
        fmt(
          ["", ...types.map(() => "\n-").slice(0, -1), ""],
          ...types.map(code),
        )
      }`,
    );
  },
);

export default composer;

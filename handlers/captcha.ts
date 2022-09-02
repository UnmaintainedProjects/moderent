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

import env from "$env";
import { Context, decrypt, encrypt } from "$utilities";
import {
  CallbackQueryContext,
  Composer,
  InlineKeyboard,
  InputFile,
} from "grammy";
import { InlineKeyboardButton } from "grammy/types.ts";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");

const BUTTONS_PER_ROW = 5;
const EMOJI_CORRECT = "✅";
const EMOJI_WRONG = "❌";

const getEmojis = (string: string) =>
  string.split(";").map((v) => v.split("-").map((v) => parseInt(v, 16))).map((
    v,
  ) => String.fromCodePoint(...v.filter((v) => !isNaN(v))));

const replaceEmoji = (
  buttons: InlineKeyboardButton.CallbackButton[][],
  emoji: string,
  replacement: string,
) =>
  buttons.map((v) =>
    v.map((v) => {
      const slices = (v as InlineKeyboardButton.CallbackButton)
        .callback_data.split(":");
      slices[1] = slices[1] == emoji ? replacement : slices[1];
      return {
        ...v,
        text: slices[1] == emoji ? replacement : slices[1],
        callback_data: slices.join(":"),
      };
    })
  );

composer.callbackQuery(/^emoji-captcha:([^:]+):/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const emoji = ctx.match![0];
  if ([EMOJI_CORRECT, EMOJI_WRONG].includes(emoji)) {
    return;
  }
  const chatId = Number(
    (ctx.msg?.reply_to_message?.reply_markup
      ?.inline_keyboard[0][0] as InlineKeyboardButton.CallbackButton)
      .callback_data,
  );
  const buttons = ctx.msg?.reply_markup
    ?.inline_keyboard as InlineKeyboardButton.CallbackButton[][];
  const correctEmojis = (await decrypt(
    buttons.flat().map((v) => v.callback_data.split(":")[2] ?? "").join(""),
  ))
    .split(";");
  const attempts = buttons.flat().filter((v) =>
    [EMOJI_CORRECT, EMOJI_WRONG].includes(v.text)
  ).length + 1;
  const previousWrongAttempts = buttons.flat().filter((v) =>
    v.text == EMOJI_WRONG
  ).length;
  if (emoji == EMOJI_WRONG || emoji == EMOJI_CORRECT) {
    return;
  }
  if (correctEmojis.includes(emoji)) {
    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: replaceEmoji(buttons, emoji, EMOJI_CORRECT),
      },
    });
    if (attempts == 6) {
      await ctx.deleteMessage();
      await ctx.api.editMessageText(
        ctx.chat?.id!,
        ctx.msg?.reply_to_message?.message_id!,
        "You're now in!",
      );
      await ctx.api.approveChatJoinRequest(chatId, ctx.chat?.id!);
    }
  } else {
    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: replaceEmoji(buttons, emoji, EMOJI_WRONG),
      },
    });
    if (previousWrongAttempts == 2) {
      await ctx.deleteMessage();
      await ctx.api.editMessageText(
        ctx.chat?.id!,
        ctx.msg?.reply_to_message?.message_id!,
        "You couldn't make it. Try again later.",
      );
    }
  }
});

async function emojiCaptcha(
  ctx: CallbackQueryContext<Context>,
) {
  const url = env.EMOJI_CAPTCHA_API_URL;
  if (!url) {
    return;
  }
  const res = await fetch(url);
  const emojis = getEmojis(res.headers.get("x-emojis") ?? "");
  const correctEmojis = getEmojis(res.headers.get("x-correct-emojis") ?? "");
  if (emojis.length == 0 || correctEmojis.length == 0) {
    return;
  }
  let encrypted = await encrypt(correctEmojis.join(";"));
  const keyboard = new InlineKeyboard();
  for (let i = 0; i < emojis.length; i += BUTTONS_PER_ROW) {
    for (
      const emoji of emojis.slice(i, i + BUTTONS_PER_ROW)
    ) {
      let data = `emoji-captcha:${emoji}:`;
      const available = 64 - new TextEncoder().encode(data).length;
      data += encrypted.slice(0, available);
      encrypted = encrypted.slice(available);
      keyboard.text(emoji, data);
    }
    keyboard.row();
  }
  await ctx.replyWithPhoto(new InputFile(new Blob([await res.arrayBuffer()])), {
    caption: "What emojis do you see in the photo?",
    reply_markup: keyboard,
  });
}

composer.callbackQuery(/^captcha:/, async (ctx) => {
  await ctx.editMessageReplyMarkup({
    reply_markup: new InlineKeyboard().text(
      "Start",
      ctx.callbackQuery.data.split(":")[1],
    ),
  });
  return emojiCaptcha(ctx);
});

filter.on("chat_join_request", async (ctx) => {
  await ctx.api.sendMessage(
    ctx.from.id,
    `Hi ${ctx.from.first_name}, you should solve a captcha to be accepted in ${ctx.chat.title}.`,
    {
      reply_markup: new InlineKeyboard().text(
        "Start",
        `captcha:${ctx.chat.id}`,
      ),
    },
  );
});

export default composer;

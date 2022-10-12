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

import {
  base64DecryptAesCbcWithIv,
  base64EncryptAesCbcWithIv,
  Context,
} from "$utilities";
import { deleteCaptchaState } from "$database";
import env from "$env";
import { InlineKeyboardButton } from "grammy/types.ts";
import {
  CallbackQueryContext,
  Composer,
  InlineKeyboard,
  InputFile,
} from "grammy";

const composer = new Composer<Context>();

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
  const emoji = ctx.match![1];
  if ([EMOJI_CORRECT, EMOJI_WRONG].includes(emoji)) {
    return;
  }
  let deleteState = false;
  const chatId = Number(
    (ctx.msg?.reply_to_message?.reply_markup
      ?.inline_keyboard[0][0] as InlineKeyboardButton.CallbackButton)
      .callback_data,
  );
  // ./mod.ts:78
  const chatName = ctx.msg?.reply_to_message?.text!.slice(47).slice(0, -1);
  const buttons = ctx.msg?.reply_markup
    ?.inline_keyboard as InlineKeyboardButton.CallbackButton[][];
  const correctEmojis = (await base64DecryptAesCbcWithIv(
    buttons.flat().map((v) => v.callback_data.split(":")[2] ?? "").join(""),
  ))
    .split(";");
  const previousCorrectAttempts = buttons.flat().filter((v) =>
    v.text == EMOJI_CORRECT
  ).length;
  const previousWrongAttempts =
    buttons.flat().filter((v) => v.text == EMOJI_WRONG).length;
  if (emoji == EMOJI_WRONG || emoji == EMOJI_CORRECT) {
    return;
  }
  if (correctEmojis.includes(emoji)) {
    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: replaceEmoji(buttons, emoji, EMOJI_CORRECT),
      },
    });
    if (previousCorrectAttempts == 5) {
      await ctx.deleteMessage();
      deleteState = await ctx.api.approveChatJoinRequest(chatId, ctx.chat!.id);
      await ctx.api.editMessageText(
        ctx.chat!.id,
        ctx.msg!.reply_to_message!.message_id,
        `Your request to join ${chatName} was approved.`,
      );
    }
  } else {
    await ctx.editMessageReplyMarkup({
      reply_markup: {
        inline_keyboard: replaceEmoji(buttons, emoji, EMOJI_WRONG),
      },
    });
    if (previousWrongAttempts == 2) {
      await ctx.deleteMessage();
      deleteState = await ctx.api.declineChatJoinRequest(chatId, ctx.chat!.id);
      await ctx.api.editMessageText(
        ctx.chat!.id,
        ctx.msg!.reply_to_message!.message_id,
        `Your request to join ${chatName} was declined.`,
      );
    }
  }
  if (deleteState) {
    await deleteCaptchaState(ctx.chat!.id, chatId);
  }
});

export async function emoji(
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
  let encrypted = await base64EncryptAesCbcWithIv(correctEmojis.join(";"));
  const keyboard = new InlineKeyboard();
  for (const [i, emoji] of emojis.entries()) {
    let data = `emoji-captcha:${emoji}:`;
    const available = 64 - new TextEncoder().encode(data).length;
    data += encrypted.slice(0, available);
    encrypted = encrypted.slice(available);
    keyboard.text(emoji, data);
    if (i % BUTTONS_PER_ROW === (BUTTONS_PER_ROW - 1)) {
      keyboard.row();
    }
  }
  await ctx.replyWithPhoto(
    new InputFile(new Blob([await res.arrayBuffer()])),
    {
      caption: "Which emojis do you see in the photo?",
      reply_markup: keyboard,
      reply_to_message_id: ctx.msg?.message_id,
    },
  );
}

export default composer;

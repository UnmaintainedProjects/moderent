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
import { fmt, underline } from "grammy_parse_mode";
import { Composer, InlineKeyboard } from "grammy";

const composer = new Composer<Context>();
const filter = composer.chatType("private");

filter.command(
  "start",
  (ctx) =>
    ctx.replyFmt(
      fmt`I\u2019m Moderent \u2014 the diff${underline("erent")} way to ${
        underline("mod")
      }erate.

Read the /help to learn more or get started right away by adding me to your group.`,
      {
        reply_markup: new InlineKeyboard().url(
          "Add to a group",
          `https://t.me/${ctx.me.username}?startgroup=add`,
        ),
      },
    ),
);

const HELPS: Record<string, string> = {
  "CAPTCHAs": ``,
  "Admin": ``,
  "Log Channels": ``,
};

const HELP_MAIN = fmt`Moderent lets you ${
  underline("mod")
}erate your groups diff${"erent"}ly. With its diverse capabilities and straightforwardness, you can keep your groups away from undesirable situations.

Use the buttons below to learn more about capabilities.`;

const HELP_MAIN_REPLY_MARKUP = new InlineKeyboard();

const BUTTONS_PER_ROW = 3;

for (const [i, [name]] of Object.entries(HELPS).entries()) {
  HELP_MAIN_REPLY_MARKUP.text(name, `help_${name}`);
  if (i % BUTTONS_PER_ROW == (BUTTONS_PER_ROW - 1)) {
    HELP_MAIN_REPLY_MARKUP.row();
  }
}

filter.callbackQuery(/^help_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const name = ctx.match![1];
  const help = HELPS[name];
  if (!help) {
    return;
  }
  await ctx.editMessageText(help, {
    reply_markup: new InlineKeyboard().text("Back", "back"),
  });
});

filter.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(HELP_MAIN.text, {
    entities: HELP_MAIN.entities,
    reply_markup: HELP_MAIN_REPLY_MARKUP,
  });
});

filter.command("help", async (ctx) => {
  await ctx.replyFmt(HELP_MAIN, { reply_markup: HELP_MAIN_REPLY_MARKUP });
});

export default composer;

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
import { fmt, FormattedString, underline, bold } from "grammy_parse_mode";
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

const helps: Record<string, FormattedString> = {
  "CAPTCHAs": fmt`${bold("CAPTCHAs")}

You can require users to solve a CAPTCHA before they can join the group. To set this up:

1. Give me the right to create invite links in your group.
2. Go to your group\u2019s settings and enable join requests.
3. Enable CAPTCHA with the /setcaptcha command.

${bold("Commands")}

/captcha \u2014 shows the current CAPTCHA setting
/setcaptcha [type | off] \u2014 enables, disables or changes the CAPTCHA type
/available_captcha_types \u2014 shows the available CAPTCHA types`,
  "Restrictions": fmt`${bold("Restrictions")}

These commands let you restrict users with an optional expiration time and reason.

${bold("Commands")}

/ban ([user ID]) ([duration]([h|d])) ([reason]) - bans the target user
/dban ([user ID]) ([duration]([h|d])) ([reason]) \u2014 bans the target user, silently
/unban ([user ID]) ([reason]) \u2014 unbans the target user
/mute ([user ID]) ([duration]([h|d])) ([reason]) \u2014 mutes the target user
/dmute ([user ID]) ([duration]([h|d])) ([reason]) \u2014 mutes the target user, silently
/unmute ([user ID]) ([reason]) \u2014 unmutes the target user
/kick ([user ID]) ([reason]) \u2014 kicks the target user

${bold("Notes")}

\u2014 The above commands require the right to restrict members.
\u2014 The commands starting with "d" require the right to delete messages as well.
\u2014 The [user ID] parameter is required if not replying to a message.
\u2014 The [duration] parameter lets you set a time for the restriction to automatically revert, in seconds, or in hours or days if you use one of the h or d suffixes.`,
  "Log Channels": fmt`${bold("Log Channels")}

A log channel will include live logs of things going on in the group, for example, restrictions. To set one up:

1. You should be the owner of the group.
2. Add and promote me in the channel you would like to use for logging.
3. Get your log channel\u2019s ID and use the command /setlogchannel to activate it.

${bold("Commands")}

/logchannel \u2014 shows the current log channel setting
/setlogchannel [channel ID] \u2014 set or changes the log channel
/unsetlogchannnel \u2014 removes the log channel`,
  "Messages": fmt`${bold("Messages")}

These commands makes working with messages easier.

${bold("Commands")}

/pin \u2014 pins the replied message
/unpin \u2014 unpins the replied message

${bold("Notes")}

\u2014 /pin and /unpin require the right to pin messages.`,
};

const home = fmt`Moderent lets you ${
  underline("mod")
}erate your groups diff${underline("erent")}ly. With its diverse capabilities and straightforwardness, you can keep your groups away from undesirable situations.

Use the buttons below to learn more about capabilities.`;

const BUTTONS_PER_ROW = 3;
const homeKeyboard = new InlineKeyboard();
for (const [i, [name]] of Object.entries(helps).entries()) {
  homeKeyboard.text(name, `help_${name}`);
  if (i % BUTTONS_PER_ROW == (BUTTONS_PER_ROW - 1)) {
    homeKeyboard.row();
  }
}

filter.callbackQuery(/^help_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const name = ctx.match![1];
  const help = helps[name];
  if (!help) {
    return;
  }
  await ctx.editMessageText(help.text, {
    entities: help.entities,
    reply_markup: new InlineKeyboard().text("Back", "back"),
  });
});

filter.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(home.text, {
    entities: home.entities,
    reply_markup: homeKeyboard,
  });
});

filter.command("help", async (ctx) => {
  await ctx.replyFmt(home.text, {
    entities: home.entities,
    reply_markup: homeKeyboard,
  });
});

export default composer;

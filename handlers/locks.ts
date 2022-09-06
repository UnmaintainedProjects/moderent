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

import { Context, withRights } from "$utilities";
import { getSettings, updateSettings } from "$database";
import { code, fmt } from "grammy_parse_mode";
import { Composer } from "grammy";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights([
  "can_restrict_members",
  "can_change_info",
  "can_delete_messages",
]);

const lockTypes = [
  "::bold",
  "::bot_command",
  "::cashtag",
  "::code",
  "::email",
  "::hashtag",
  "::italic",
  "::mention",
  "::phone_number",
  "::pre",
  "::spoiler",
  "::strikethrough",
  "::text_link",
  "::text_mention",
  "::underline",
  "::url",
  ":animation",
  ":audio",
  ":caption",
  ":caption_entities",
  ":contact",
  ":delete_chat_photo",
  ":dice",
  ":document",
  ":entities",
  ":forward_date",
  ":game",
  ":invoice",
  ":is_automatic_forward",
  ":location",
  ":message_auto_delete_timer_changed",
  ":new_chat_photo",
  ":new_chat_title",
  ":photo",
  ":pinned_message",
  ":poll",
  ":proximity_alert_triggered",
  ":sticker",
  ":text",
  ":venue",
  ":video",
  ":video_chat_ended",
  ":video_chat_participants_invited",
  ":video_chat_scheduled",
  ":video_chat_started",
  ":video_note",
  ":voice",
  ":web_app_data",
  "edited_message",
  "message",
  "rtl",
];

filter.command("locktypes", (ctx) =>
  ctx.replyFmt(
    fmt`Available CAPTCHA types:\n- ${
      fmt(
        ["", ...lockTypes.map(() => ["", "\n-"]).flat()],
        ...lockTypes.map(code),
      )
    }`,
  ));

filter.command("setlocks", rights, async (ctx) => {
  const locks = ctx.message.text
    .slice(ctx.message.text.split(/\s/)[0].length)
    .split(/\s/)
    .map((v) => v.toLowerCase());
  if (locks.length < 0) {
    return ctx.reply("Pass at least one lock type. See /locktypes.");
  }
  for (const lock of locks) {
    if (!lockTypes.includes(lock)) {
      return ctx.replyFmt(
        fmt`Invalid lock type: ${code(lock)}. See /locktypes.`,
      );
    }
  }
  await updateSettings(ctx.chat.id, { locks });
  await ctx.reply("Lock list updated.");
});

filter.command("unsetlocks", async (ctx) => {
  await updateSettings(ctx.chat.id, { locks: [] });
  await ctx.reply("Locks were unset.");
});

filter.command("locks", async (ctx) => {
  const { locks } = await getSettings(ctx.chat.id);
  if (!locks) {
    await ctx.reply("No locks are set.");
  } else {
    await ctx.replyFmt(
      fmt`Current locks:\n- ${
        fmt(
          ["", ...locks.map(() => ["", "\n-"]).flat()],
          ...locks.map(code),
        )
      }`,
    );
  }
});

export default composer;

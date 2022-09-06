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
import { Composer, FilterQuery } from "grammy";

const composer = new Composer<Context>();
const filter = composer.chatType("supergroup");
const rights = withRights([
  "can_restrict_members",
  "can_change_info",
  "can_delete_messages",
]);

const locks: Record<string, string | ((ctx: Context) => boolean)> = {
  all: () => true,
  album: (ctx) => ctx.msg?.media_group_id !== undefined,
  anonchannel: (ctx) =>
    !!(ctx.msg?.sender_chat && ctx.msg.sender_chat.id != ctx.chat?.id),
  audio: ":audio",
  bot: (ctx) => ctx.msg?.new_chat_members?.filter((v) => v.is_bot).length != 0,
  button: (ctx) => !!ctx.msg?.reply_markup?.inline_keyboard,
  command: "::bot_command",
  comment: "",
  contact: ":contact",
  document: ":document",
  email: "::email",
  emoji: (ctx) => /\p{Emoji}/u.test(ctx.msg?.text ?? ctx.msg?.caption ?? ""),
  emojicustom: (ctx) =>
    (ctx.msg?.entities ?? ctx.msg?.caption_entities)
      ?.filter((v) => v.type == "custom_emoji").length != 0,
  emojigame: ":dice",
  emojionly: (ctx) =>
    /^\p{Emoji}+$/u.test(ctx.msg?.text ?? ctx.msg?.caption ?? ""),
  forward: ":forward_date",
  forwardbot: (ctx) => !!ctx.msg?.forward_from?.is_bot,
  forwardchannel: (ctx) => !!ctx.msg?.forward_from_chat,
  forwarduser: (ctx) => !ctx.msg?.forward_from?.is_bot,
  game: ":game",
  gif: ":animation",
  inline: (ctx) => !!ctx.msg?.via_bot,
  invitelink: (ctx) =>
    (ctx.msg?.entities ?? ctx.msg?.caption_entities)
      ?.filter((v) => v.type == "text_link" || v.type == "url")
      .map((v) =>
        v.type == "text_link" ? v.url : ctx.msg?.text
          ?.slice(
            v.offset,
            ctx.msg.text.slice(v.offset).length + v.length,
          )
      )
      .filter((v) => v)
      .map((v) => new URL(v!))
      .filter(
        (v) =>
          ["telegram.me", "telegram.dog", "t.me"]
            .some((v_) => v.hostname.endsWith(v_)),
      )
      .filter((v) => v.hostname.split(".").length != 2 || v.pathname != "/")
      .length != 0,
  location: ":location",
  phone: "::phone_number",
  photo: ":photo",
  poll: ":poll",
  rtl: (ctx) =>
    /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/
      .test(ctx.message?.text ?? "" + ctx.message?.caption ?? ""),
  spoiler: "::spoiler",
  sticker: ":sticker",
  stickeranimated: (ctx) => !!ctx.msg?.sticker?.is_animated,
  stickerpremium: (ctx) => !!ctx.msg?.sticker?.premium_animation,
  text: ":text",
  url: (ctx) =>
    (ctx.msg?.entities ?? ctx.msg?.caption_entities)
      ?.filter((v) => ["url", "text_url"].includes(v.type))
      .length != 0,
  video: ":video",
  videonote: ":video_note",
  voice: ":voice",
};

const lockDescriptions: Record<keyof typeof locks, string> = {
  all: "All messages",
  album: "Medias sent as group",
  anonchannel: "Messages from unknown channels",
  audio: "Audio messages",
  bot: "Adding bots",
  button: "Messages with buttons",
  command: "Messages containing bot commands",
  comment: "Comments on posts from the connected channel",
  contact: "Contacts",
  document: "Documents",
  email: "Messages cotaining email addresses",
  emoji: "Messages cotaining emoji",
  emojicustom: "Messages cotaining custom emoji",
  emojigame: "Emoji games",
  emojionly: "Emoji-only messages",
  forward: "Forwarded messages",
  forwardbot: "Messages forwarded from bots",
  forwardchannel: "Messages forwarded from channels",
  forwarduser: "Messages forwarded from users",
  game: "Games",
  gif: "GIFs",
  inline: "Messages from inline queries",
  invitelink: "Chat links",
  location: "Locations",
  phone: "Messages cotaining phone numbers",
  photo: "Photos",
  poll: "Polls",
  rtl: "Right-to-left text (Hebrew, Arabic, etc.)",
  spoiler: "Spoilers",
  sticker: "Stickers",
  stickeranimated: "Animated stickers",
  stickerpremium: "Stickers with premium animations",
  text: "Text messages",
  url: "Messages containing links",
  video: "Videos",
  videonote: "Video notes",
  voice: "Voice messages",
};

filter.use(async (ctx, next) => {
  if (
    !(ctx.from &&
      ctx.session.admins.has(ctx.from.id))
  ) {
    const { locks: locks_ } = await getSettings(ctx.chat.id);
    if (locks_) {
      for (const lock_ of locks_) {
        const lock = locks[lock_];
        if (lock) {
          if (
            typeof lock === "string" && ctx.has(lock as FilterQuery) ||
            typeof lock === "function" && lock(ctx)
          ) {
            return ctx.deleteMessage();
          }
        }
      }
    }
  }
  await next();
});

filter.command("locktypes", (ctx) => {
  return ctx.replyFmt(
    fmt`Available lock types:\n- ${
      fmt(
        ["", ...Object.keys(locks).map(() => "\n- ").slice(0, -1), ""],
        ...Object.keys(locks).map(code),
      )
    }`,
  );
});

function getLocks(text: string) {
  return [
    ...new Set(
      text
        .slice(text.split(/\s/)[0].length)
        .split(/\s/)
        .map((v) => v.trim().toLowerCase())
        .filter((v) => v)
        .sort(),
    ),
  ];
}

filter.command("lock", rights, async (ctx) => {
  const locks = getLocks(ctx.message.text);
  if (locks.length < 0) {
    return ctx.reply("Pass at least one lock type. See /locktypes.");
  }
  for (const lock of locks) {
    if (!Object.keys(locks).includes(lock)) {
      return ctx.replyFmt(
        fmt`Invalid lock type: ${code(lock)}. See /locktypes.`,
      );
    }
  }
  const { locks: locks_ = [] } = await getSettings(ctx.chat.id);
  const result = await updateSettings(
    ctx.chat.id,
    { locks: [...new Set([...locks_, ...locks])].sort() },
  );
  await ctx.reply(result ? "Lock list updated." : "Lock list not updated.");
});

filter.command("unlock", async (ctx) => {
  const locks = getLocks(ctx.message.text);
  if (locks.length < 0) {
    return ctx.reply("Pass at least one lock type. See /locktypes.");
  }
  for (const lock of locks) {
    if (!Object.keys(locks).includes(lock)) {
      return ctx.replyFmt(
        fmt`Invalid lock type: ${code(lock)}. See /locktypes.`,
      );
    }
  }
  let { locks: locks_ = [] } = await getSettings(ctx.chat.id);
  locks_ = locks_.filter((v) => !locks.includes(v));
  const result = await updateSettings(ctx.chat.id, { locks: locks_ });
  await ctx.reply(
    result
      ? "The provided locks were unlocked."
      : "The provided locks are already unlocked.",
  );
});

filter.command("locks", async (ctx) => {
  const { locks } = await getSettings(ctx.chat.id);
  if (!locks) {
    await ctx.reply("No locks are set.");
  } else {
    await ctx.replyFmt(
      fmt`Current locks:\n- ${
        fmt(
          ["", ...locks.map(() => "\n-").slice(0, -1), ""],
          ...locks.map(code),
        )
      }`,
    );
  }
});

export default composer;

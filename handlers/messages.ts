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
import { Composer } from "grammy";

const composer = new Composer<Context>();

export default composer;

const canPin = composer.on("message").filter(withRights("can_pin_messages"));

canPin.command("pin", async (ctx) => {
  if (!ctx.message?.reply_to_message) {
    await ctx.reply("Reply a message to pin.");
    return;
  }
  await ctx.pinChatMessage(ctx.message.reply_to_message.message_id);
  await ctx.reply("Pinned.");
});

canPin.command("unpin", async (ctx) => {
  if (!ctx.message?.reply_to_message) {
    await ctx.reply("Reply a pinned message to unpin.");
    return;
  }
  await ctx.unpinChatMessage(ctx.message.reply_to_message.message_id);
  await ctx.reply("Unpinned.");
});

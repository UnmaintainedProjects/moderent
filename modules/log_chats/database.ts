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

import { database } from "$database";
import { Collection } from "mongo";

export interface LogChat {
  chatId: number;
  logChatId: number;
}

let collection: Collection<LogChat>;
const cache = new Map<number, number | null>();

export function initialize() {
  collection = database.collection<LogChat>("log_chats");
  collection.createIndexes({
    indexes: [
      {
        key: { "chatId": 1 },
        name: "chatId",
        unique: true,
      },
      {
        key: { "logChatId": 1 },
        name: "logChatId",
        unique: true,
      },
    ],
  });
}

export async function setLogChat(chatId: number, logChatId: number) {
  await collection.updateOne({ chatId }, { $set: { logChatId } }, {
    upsert: true,
  });
  cache.set(chatId, logChatId);
}

export async function unsetLogChat(chatId: number) {
  const result = await collection.deleteOne({ chatId });
  cache.set(chatId, null);
  return result;
}

export async function getLogChat(chatId: number) {
  let logChatId = cache.get(chatId);
  if (!logChatId) {
    const logChat = await collection.findOne({ chatId });
    if (logChat) {
      logChatId = logChat.logChatId;
    } else {
      logChatId = null;
    }
    cache.set(chatId, logChatId);
  }
  return logChatId;
}

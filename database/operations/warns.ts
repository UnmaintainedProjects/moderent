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

import { database } from "../database.ts";
import { Collection } from "mongo";

let collection: Collection<
  {
    userId: number;
    chatId: number;
    warns: number;
  }
>;
const cache = new Map<`${number}${number}`, number | null>();

export function initializeWarns() {
  collection = database.collection("warns");
  collection.createIndexes({
    indexes: [
      {
        key: { "userId": 1, "chatId": 1 },
        name: "userIdchatId",
        unique: true,
      },
    ],
  });
}

export async function getWarns(userId: number, chatId: number) {
  let warns = cache.get(`${userId}${chatId}`);
  if (typeof warns !== "number") {
    warns = (await collection.findOne({ userId, chatId }))?.warns ?? 0;
    cache.set(`${userId}${chatId}`, warns);
  }
  return warns;
}

export async function warn(
  userId: number,
  chatId: number,
): Promise<number> {
  let warns = await getWarns(userId, chatId);
  await collection.updateOne({ userId, chatId }, { $inc: { warns: 1 } });
  warns++;
  cache.set(`${userId}${chatId}`, warns);
  return warns;
}

export async function unwarn(
  userId: number,
  chatId: number,
  all?: boolean,
): Promise<number> {
  let warns = await getWarns(userId, chatId);
  if (warns > 0) {
    if (all) {
      await collection.updateOne({ userId, chatId }, { $set: { warns: 0 } });
      warns = 0;
    } else {
      await collection.updateOne({ userId, chatId }, { $dec: { warns: 1 } });
      warns--;
    }
  }
  cache.set(`${userId}${chatId}`, warns);
  return warns;
}

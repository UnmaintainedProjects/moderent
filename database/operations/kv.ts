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

export interface Kv<T = unknown> {
  key: string;
  value: T;
}

let collection: Collection<Kv>;
// deno-lint-ignore no-explicit-any
const cache = new Map<string, any>();

export function initializeKv() {
  collection = database.collection("kv");
  collection.createIndexes({
    indexes: [
      {
        key: { "key": 1 },
        name: "key",
        unique: true,
      },
    ],
  });
}

export async function get<T = unknown>(key: string): Promise<T | null> {
  let value = cache.get(key);
  if (!value) {
    value = (await collection.findOne({ key }))?.value ?? null;
  }
  return value;
}

export async function set<T = unknown>(key: string, value: T) {
  const result = await collection.updateOne(
    { key },
    { $set: { value } },
    { upsert: true },
  );
  cache.set(key, value);
  return result.modifiedCount + result.upsertedCount > 0;
}

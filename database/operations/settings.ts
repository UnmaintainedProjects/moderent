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

export enum Captcha {
  Emoji = "emoji",
}

export interface Settings {
  logChannel?: number | null;
  captcha?: Captcha | null;
  locks?: string[];
  warnLimit: number;
}

const DEFAULT_SETTINGS: Settings = { warnLimit: 3 };

let collection: Collection<Partial<Settings> & { id: number }>;
const cache = new Map<number, Partial<Settings>>();

export function initializeSettings() {
  collection = database.collection("settings");
  collection.createIndexes({
    indexes: [
      {
        key: { "id": 1 },
        name: "id",
        unique: true,
      },
    ],
  });
}

export async function getSettings(id: number): Promise<Settings> {
  let settings = cache.get(id);
  if (typeof settings === "undefined") {
    settings = await collection.findOne({ id }) ?? {};
    cache.set(id, settings);
  }
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function updateSettings(id: number, settings: Partial<Settings>) {
  const result = await collection.updateOne(
    { id },
    { $set: { ...settings } },
    { upsert: true },
  );
  cache.set(id, { ...cache.get(id) ?? {}, ...settings });
  return result.modifiedCount + result.upsertedCount > 0;
}

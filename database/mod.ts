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

import { initialize } from "./operations/mod.ts";
import { setDatabase } from "./database.ts";
import env from "$env";
import { MongoClient } from "mongo";

const client = new MongoClient();

export * from "./operations/mod.ts";

export async function connect() {
  setDatabase(await client.connect(env.MONGODB_URI));
  await initialize();
}

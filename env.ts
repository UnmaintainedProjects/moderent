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

import { bool, cleanEnv, host, port, str, url } from "envalid";
import { config } from "std/dotenv/mod.ts";

await config({ export: true });

export default cleanEnv(Deno.env.toObject(), {
  USE_WEBHOOK: bool({ default: false }),
  WEBHOOK_HOST: host({ default: "127.0.0.1" }),
  WEBHOOK_PORT: port({ default: 3000 }),
  BOT_TOKEN: str(),
  MONGODB_URI: url(),
  EMOJI_CAPTCHA_API_URL: url({ default: "" }),
});

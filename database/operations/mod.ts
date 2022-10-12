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

import { initializeCaptchaStates } from "./captcha_states.ts";
import { initializeKv } from "./kv.ts";
import { initializeSettings } from "./settings.ts";
import { initializeWarns } from './warns.ts'

export function initialize() {
  return Promise.all([
    initializeCaptchaStates(),
    initializeKv(),
    initializeSettings(),
    initializeWarns()
  ]);
}

export * from "./captcha_states.ts";
export * from "./kv.ts";
export * from "./settings.ts";
export * from './warns.ts'
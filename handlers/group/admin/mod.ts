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

import { Composer } from "grammy";
import { Context } from "$utilities";

import ban from "./ban.ts";
import mute from "./mute.ts";
import pin from "./pin.ts";
import kick from "./kick.ts";

const composer = new Composer<Context>();

export default composer;

composer.use((ctx, next) => {
  if (ctx.from && ctx.session.admins.has(ctx.from.id)) {
    return next();
  }
});

composer.use(ban);
composer.use(mute);
composer.use(pin);
composer.use(kick);

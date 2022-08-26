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

import { Context } from "grammy";

const timeExp = /^([1-9])+(h|d)$/;

function removeFirst(string: string) {
  return string.slice(string.split(/\s/, 1)[0].length).trim();
}

export interface RestrictionParameters {
  user: number;
  untilDate?: number;
  readableUntilDate: string;
  reason?: string;
}

export function getRestrictionParameters(
  ctx: Context,
  noUntilDate?: boolean,
): RestrictionParameters {
  const params: RestrictionParameters = {
    user: ctx.msg?.reply_to_message?.from?.id || 0,
    readableUntilDate: "",
  };
  if (ctx.msg?.text) {
    let text = removeFirst(ctx.msg.text);
    let firstPart = text.split(/\s/)[0];
    const id = Number(firstPart);
    if (id) {
      text = removeFirst(text);
      params.user = id;
    }
    firstPart = text.split(/\s/)[0];
    if (!noUntilDate) {
      const match = firstPart.match(timeExp);
      if (match) {
        text = removeFirst(text);
        const time = Number(match[1]);
        const unit = match[2];
        const toAdd = unit == "h" ? time * 60 ** 2 : time * 60 ** 2 * 24;
        params.untilDate = Date.now() / 1000 + toAdd;
        params.readableUntilDate = `${time} ${
          { "h": "hour", "d": "day" }[unit]
        }${time == 1 ? "" : "s"}`;
        params.readableUntilDate = params.readableUntilDate
          ? " for " + params.readableUntilDate
          : "";
      }
    }
    params.reason = text;
  }
  return params;
}

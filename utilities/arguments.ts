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

import { Context, Filter } from "grammy";

export const timeExp = /^([1-9][0-9]*)+(h|d)$/;

function removeFirst(string: string) {
  return string.slice(string.split(/\s/, 1)[0].length).trim();
}

export interface RestrictionParameters {
  user: number;
  untilDate?: number;
  readableUntilDate: string;
  reason?: string;
}

export function getUntilDate(string: string) {
  const match = string.match(timeExp);
  let untilDate = 0;
  let readableUntilDate = "";
  if (match) {
    string = removeFirst(string);
    const time = Number(match[1]);
    if (time >= 1 && time <= 365) {
      const unit = match[2];
      const toAdd = unit == "h" ? time * 60 ** 2 : time * 60 ** 2 * 24;
      untilDate = Date.now() / 1000 + toAdd;
      readableUntilDate = `${time} ${{ "h": "hour", "d": "day" }[unit]}${
        time == 1 ? "" : "s"
      }`;
      readableUntilDate = readableUntilDate ? ` for ${readableUntilDate}` : "";
    }
  }
  return { untilDate, readableUntilDate };
}

export function getRestrictionParameters(
  ctx: Filter<Context, "msg:text">,
  noUntilDate?: boolean,
): RestrictionParameters {
  const params: RestrictionParameters = {
    user: ctx.msg.reply_to_message?.from?.id || 0,
    readableUntilDate: "",
  };
  let text = removeFirst(ctx.msg.text);
  let firstPart = text.split(/\s/)[0];
  const id = Number(firstPart);
  if (id) {
    text = removeFirst(text);
    params.user = id;
  }
  firstPart = text.split(/\s/)[0];
  if (!noUntilDate) {
    const { untilDate, readableUntilDate } = getUntilDate(firstPart);
    if (readableUntilDate) {
      text = removeFirst(text);
      params.untilDate = untilDate;
      params.readableUntilDate = readableUntilDate;
    }
  }
  if (text) {
    params.reason = text;
  }
  return params;
}

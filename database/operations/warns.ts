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
 
 export async function getCaptchaState(
   userId: number,
   chatId: number,
 ): Promise<CaptchaState | null> {
   let captchaState = cache.get(`${userId}${chatId}`);
   if (typeof captchaState === "undefined") {
     captchaState = await collection.findOne({ userId, chatId }) ?? null;
     cache.set(`${userId}${chatId}`, captchaState);
   }
   return captchaState;
 }
 
 export async function updateCaptchaState(
   userId: number,
   chatId: number,
   state: CaptchaState,
 ) {
   const result = await collection.updateOne({ userId, chatId }, {
     $set: { ...state },
   }, {
     upsert: true,
   });
   cache.set(`${userId}${chatId}`, {
     ...cache.get(`${userId}${chatId}`) ?? {},
     ...state,
   });
   return result.modifiedCount + result.upsertedCount > 0;
 }
 
 export async function deleteCaptchaState(userId: number, chatId: number) {
   const result = await collection.deleteOne({ userId, chatId });
   cache.delete(`${userId}${chatId}`);
   return result > 0;
 }
 
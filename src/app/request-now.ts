import { connection } from "next/server";

/** Request-time clock; opt out of Cache Components prerender for `new Date()`. */
export async function requestNow(): Promise<Date> {
  await connection();
  return new Date();
}

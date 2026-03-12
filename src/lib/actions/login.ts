"use server";

import { DUMMY_ACCOUNT } from "@/lib/data/account";

export async function checkDriverPassword(
  username: string,
  password: string
): Promise<boolean> {
  const expectedPassword = process.env.DRIVER_PASS;
  if (!expectedPassword) return false;
  return username === DUMMY_ACCOUNT.username && password === expectedPassword;
}

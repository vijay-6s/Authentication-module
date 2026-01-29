// src/lib/zoho-token.store.ts
import { redis } from "./redis";
import type { ZohoDC } from "@/types/zoho";

export async function bindDcToToken(
  accessToken: string,
  dc: ZohoDC,
  expiresIn: number
): Promise<void> {
  await redis.setex(
    `zoho:token:${accessToken}`,
    expiresIn,
    JSON.stringify(dc)
  );
}

export async function getDcByToken(
  token: string
): Promise<ZohoDC | null> {
  const raw = await redis.get(`zoho:token:${token}`);
  return raw ? (JSON.parse(raw) as ZohoDC) : null;
}

export async function deleteToken(token: string): Promise<void> {
  await redis.del(`zoho:token:${token}`);
}

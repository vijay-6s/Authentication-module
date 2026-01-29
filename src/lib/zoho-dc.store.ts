// src/lib/zoho-dc.store.ts
import { redis } from "./redis";
import type { ZohoDC } from "@/types/zoho";

/* -------------------- TTLs -------------------- */
const CODE_TTL = 180; // 3 minutes
const TOKEN_TTL = 3600; // 1 hour max

/* ======================================================================
   Authorization Code → DC
   ====================================================================== */

export async function storeDcByCode(
  code: string,
  dc: ZohoDC
): Promise<void> {
  await redis.setex(
    `zoho:code:${code}`,
    CODE_TTL,
    JSON.stringify(dc)
  );
}

export async function getDcByCode(
  code: string
): Promise<ZohoDC | null> {
  const raw = await redis.get(`zoho:code:${code}`);
  return raw ? (JSON.parse(raw) as ZohoDC) : null;
}

export async function deleteCode(code: string): Promise<void> {
  await redis.del(`zoho:code:${code}`);
}

/* ======================================================================
   Access Token → DC
   ====================================================================== */

export async function bindDcToToken(
  accessToken: string,
  dc: ZohoDC,
  expiresIn: number
): Promise<void> {
  await redis.setex(
    `zoho:token:${accessToken}`,
    Math.min(expiresIn, TOKEN_TTL),
    JSON.stringify(dc)
  );
}

export async function getDcByToken(
  accessToken: string
): Promise<ZohoDC | null> {
  const raw = await redis.get(`zoho:token:${accessToken}`);
  return raw ? (JSON.parse(raw) as ZohoDC) : null;
}

export async function deleteToken(
  accessToken: string
): Promise<void> {
  await redis.del(`zoho:token:${accessToken}`);
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { base64UrlDecodeToString, base64UrlEncode } from "./base64url";

export type SignedToken<T extends object> = {
  payload: T;
};

function hmacSha256(secret: string, data: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(data).digest());
}

export function signToken<T extends object>(payload: T, secret: string): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacSha256(secret, body);
  return `${body}.${sig}`;
}

export function verifyToken<T extends object>(token: string, secret: string): SignedToken<T> | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = hmacSha256(secret, body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  try {
    const json = base64UrlDecodeToString(body);
    const payload = JSON.parse(json) as T;
    return { payload };
  } catch {
    return null;
  }
}


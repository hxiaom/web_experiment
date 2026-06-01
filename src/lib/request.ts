import { createHash } from "node:crypto";

export function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

export function hashIp(ip: string, secret: string): string {
  return createHash("sha256").update(`${ip}::${secret}`).digest("hex");
}

export function getUserAgent(req: Request): string | null {
  const ua = req.headers.get("user-agent");
  return ua ? ua.slice(0, 500) : null;
}


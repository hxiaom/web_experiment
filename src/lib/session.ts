import { cookies } from "next/headers";
import { signToken, verifyToken } from "./tokens";
import { requireEnv } from "./env";

export const SESSION_COOKIE = "exp_session";
export const ADMIN_COOKIE = "exp_admin";

type SessionCookiePayload = {
  sid: string;
  pid: string;
  iat: number;
  exp: number;
};

type AdminCookiePayload = {
  iat: number;
  exp: number;
};

function getCookieOptions() {
  const secure =
    process.env.COOKIE_SECURE === "false" ? false : process.env.COOKIE_SECURE === "true" ? true : process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
}

export function getCookieOptionsForResponse() {
  return getCookieOptions();
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function createSessionCookieToken(sessionId: string, participantId: string): string {
  const secret = requireEnv("SESSION_SECRET");
  const now = Date.now();
  const exp = now + 1000 * 60 * 60 * 24 * 30;
  return signToken<SessionCookiePayload>({ sid: sessionId, pid: participantId, iat: now, exp }, secret);
}

export async function getSessionFromCookies(): Promise<{ sessionId: string; participantId: string } | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const verified = verifyToken<SessionCookiePayload>(token, secret);
  if (!verified) return null;
  if (typeof verified.payload?.exp !== "number" || verified.payload.exp < Date.now()) return null;
  return { sessionId: verified.payload.sid, participantId: verified.payload.pid };
}

export function getSessionFromRequest(req: Request): { sessionId: string; participantId: string } | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const jar = parseCookieHeader(req.headers.get("cookie"));
  const token = jar[SESSION_COOKIE];
  if (!token) return null;
  const verified = verifyToken<SessionCookiePayload>(token, secret);
  if (!verified) return null;
  if (typeof verified.payload?.exp !== "number" || verified.payload.exp < Date.now()) return null;
  return { sessionId: verified.payload.sid, participantId: verified.payload.pid };
}

export function createAdminCookieToken(): string {
  const secret = requireEnv("SESSION_SECRET");
  const now = Date.now();
  const exp = now + 1000 * 60 * 60 * 24 * 7;
  return signToken<AdminCookiePayload>({ iat: now, exp }, secret);
}

export async function isAdminFromCookies(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const verified = verifyToken<AdminCookiePayload>(token, secret);
  if (!verified) return false;
  return typeof verified.payload?.exp === "number" && verified.payload.exp > Date.now();
}

export function isAdminFromRequest(req: Request): boolean {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const jar = parseCookieHeader(req.headers.get("cookie"));
  const token = jar[ADMIN_COOKIE];
  if (!token) return false;
  const verified = verifyToken<AdminCookiePayload>(token, secret);
  if (!verified) return false;
  return typeof verified.payload?.exp === "number" && verified.payload.exp > Date.now();
}

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getClientIp, getUserAgent, hashIp } from "@/lib/request";
import { createSessionCookieToken, getCookieOptionsForResponse, SESSION_COOKIE } from "@/lib/session";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const db = getDb();
  const bodyText = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const participantId = (body as any)?.participant_id;
  if (typeof participantId !== "string" || participantId.trim().length < 1 || participantId.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_participant_id" }, { status: 400 });
  }

  const row = db
    .prepare("SELECT participant_id, cond FROM participants WHERE participant_id = ?")
    .get(participantId.trim()) as { participant_id: string; cond: string | null } | undefined;

  const cond = row?.cond;
  if (!row || !cond || !["high", "low", "neutral"].includes(cond)) {
    return NextResponse.json({ ok: false, error: "participant_unassigned" }, { status: 403 });
  }

  const now = Date.now();
  const sessionId = randomUUID();
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const ipHash = ip ? hashIp(ip, requireEnv("SESSION_SECRET")) : null;

  db.prepare(
    "INSERT INTO sessions (session_id, participant_id, started_at, last_seen_at, user_agent, ip_hash) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(sessionId, participantId.trim(), now, now, ua, ipHash);

  const token = createSessionCookieToken(sessionId, participantId.trim());
  const res = NextResponse.json({ ok: true, participant_id: participantId.trim(), cond, session_id: sessionId });
  res.cookies.set(SESSION_COOKIE, token, { ...getCookieOptionsForResponse(), maxAge: 60 * 60 * 24 * 30 });
  return res;
}


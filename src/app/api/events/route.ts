import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

export const runtime = "nodejs";

type IncomingEvent = {
  event_type: string;
  page?: string;
  payload?: unknown;
  turn_index?: number;
};

function getEventTs(payload: unknown, fallback: number): number {
  if (!payload || typeof payload !== "object") return fallback;
  const clientTs = (payload as { client_ts?: unknown }).client_ts;
  if (!Number.isFinite(clientTs)) return fallback;
  const ts = Math.floor(clientTs as number);
  if (ts <= 0) return fallback;
  return ts;
}

function asArray(body: unknown): IncomingEvent[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && "events" in body && Array.isArray(body.events)) return body.events;
  return [];
}

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const raw = await req.text();
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const events = asArray(parsed);
  if (events.length === 0) return NextResponse.json({ ok: true, inserted: 0 });
  if (events.length > 100) return NextResponse.json({ ok: false, error: "too_many_events" }, { status: 413 });

  const db = getDb();
  const now = Date.now();
  const insert = db.prepare(
    "INSERT INTO events (event_id, ts, participant_id, session_id, turn_index, event_type, page, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const updateSession = db.prepare("UPDATE sessions SET last_seen_at = ? WHERE session_id = ?");

  const tx = db.transaction((rows: IncomingEvent[]) => {
    for (const e of rows) {
      if (!e || typeof e.event_type !== "string" || e.event_type.length > 80) continue;
      const eventTs = getEventTs(e.payload, now);
      const turnIndex = Number.isFinite(e.turn_index) ? Math.max(0, Math.floor(e.turn_index as number)) : 0;
      const page = typeof e.page === "string" ? e.page.slice(0, 200) : null;
      const payload = e.payload === undefined ? null : JSON.stringify(e.payload).slice(0, 20000);
      insert.run(randomUUID(), eventTs, session.participantId, session.sessionId, turnIndex, e.event_type, page, payload);
    }
    updateSession.run(now, session.sessionId);
  });

  tx(events);
  return NextResponse.json({ ok: true, inserted: events.length });
}

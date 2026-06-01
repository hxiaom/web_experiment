import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const raw = await req.text();
  let parsed: any;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const participantId = (parsed?.participant_id ?? "").toString().trim();
  const cond = (parsed?.cond ?? "").toString().trim();
  if (!participantId || participantId.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_participant_id" }, { status: 400 });
  }
  if (!["high", "low", "neutral"].includes(cond)) {
    return NextResponse.json({ ok: false, error: "invalid_cond" }, { status: 400 });
  }

  const db = getDb();
  const now = Date.now();
  const existing = db
    .prepare("SELECT participant_id FROM participants WHERE participant_id = ?")
    .get(participantId) as { participant_id: string } | undefined;
  if (existing) {
    db.prepare("UPDATE participants SET cond = ?, updated_at = ? WHERE participant_id = ?").run(cond, now, participantId);
  } else {
    db.prepare("INSERT INTO participants (participant_id, cond, created_at, updated_at) VALUES (?, ?, ?, ?)").run(
      participantId,
      cond,
      now,
      now,
    );
  }

  return NextResponse.json({ ok: true, participant_id: participantId, cond });
}


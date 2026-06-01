import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminFromRequest } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = db
    .prepare("SELECT participant_id, cond, created_at, updated_at FROM participants ORDER BY updated_at DESC LIMIT 1000")
    .all();
  return NextResponse.json({ ok: true, participants: rows });
}


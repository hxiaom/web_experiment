import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getDb } from "@/lib/db";
import { isAdminFromRequest } from "@/lib/session";
import { toCsv, toNdjson } from "@/lib/serialize";

export const runtime = "nodejs";

function fmt(n: number) {
  return String(n).padStart(2, "0");
}

export async function GET(req: Request) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const db = getDb();
  const participants = db.prepare("SELECT * FROM participants ORDER BY updated_at DESC").all() as any[];
  const sessions = db.prepare("SELECT * FROM sessions ORDER BY started_at DESC").all() as any[];
  const events = db.prepare("SELECT * FROM events ORDER BY ts ASC").all() as any[];
  const chat = db.prepare("SELECT * FROM chat_messages ORDER BY ts ASC").all() as any[];

  const zip = new JSZip();
  zip.file(
    "participants.csv",
    toCsv(participants, ["participant_id", "cond", "created_at", "updated_at"]),
  );
  zip.file(
    "sessions.csv",
    toCsv(sessions, ["session_id", "participant_id", "started_at", "last_seen_at", "user_agent", "ip_hash"]),
  );

  const eventsOut = events.map((e) => ({
    ...e,
    payload: (() => {
      if (!e.payload) return null;
      try {
        return JSON.parse(e.payload);
      } catch {
        return e.payload;
      }
    })(),
  }));
  zip.file("events.ndjson", toNdjson(eventsOut));

  zip.file("chat_messages.ndjson", toNdjson(chat));

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const now = new Date();
  const filename = `web_experiment_export_${now.getFullYear()}${fmt(now.getMonth() + 1)}${fmt(now.getDate())}_${fmt(
    now.getHours(),
  )}${fmt(now.getMinutes())}${fmt(now.getSeconds())}.zip`;

  return new Response(bytes as any, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename=\"${filename}\"`,
      "cache-control": "no-store",
    },
  });
}

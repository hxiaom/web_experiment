import { NextResponse } from "next/server";
import { listAdminEvents, listAdminEventTypes, normalizeDateInput, normalizeLimit } from "@/lib/admin-events";
import { getDb } from "@/lib/db";
import { isAdminFromRequest } from "@/lib/session";

export const runtime = "nodejs";

function parseFilters(req: Request) {
  const { searchParams } = new URL(req.url);
  return {
    participantId: searchParams.get("participant_id") ?? undefined,
    sessionId: searchParams.get("session_id") ?? undefined,
    eventType: searchParams.get("event_type") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    dateFrom: normalizeDateInput(searchParams.get("date_from") ?? undefined, false),
    dateTo: normalizeDateInput(searchParams.get("date_to") ?? undefined, true),
    limit: normalizeLimit(searchParams.get("limit") ?? undefined, 100),
  };
}

export async function GET(req: Request) {
  if (!isAdminFromRequest(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const db = getDb();
  const filters = parseFilters(req);
  const { rows, total } = listAdminEvents(db, filters);
  const eventTypes = listAdminEventTypes(db);

  const events = rows.map((row) => ({
    ...row,
    payload: (() => {
      if (!row.payload) return null;
      try {
        return JSON.parse(row.payload) as unknown;
      } catch {
        return row.payload;
      }
    })(),
  }));

  return NextResponse.json({
    ok: true,
    total,
    limit: filters.limit,
    event_types: eventTypes,
    events,
  });
}

import { listAdminEvents, normalizeDateInput, normalizeLimit } from "@/lib/admin-events";
import { getDb } from "@/lib/db";
import { isAdminFromRequest } from "@/lib/session";
import { toCsv } from "@/lib/serialize";

export const runtime = "nodejs";

function fmt(n: number) {
  return String(n).padStart(2, "0");
}

function parseFilters(req: Request) {
  const { searchParams } = new URL(req.url);
  return {
    participantId: searchParams.get("participant_id") ?? undefined,
    sessionId: searchParams.get("session_id") ?? undefined,
    eventType: searchParams.get("event_type") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    dateFrom: normalizeDateInput(searchParams.get("date_from") ?? undefined, false),
    dateTo: normalizeDateInput(searchParams.get("date_to") ?? undefined, true),
    limit: normalizeLimit(searchParams.get("limit") ?? undefined, 500),
  };
}

export async function GET(req: Request) {
  if (!isAdminFromRequest(req)) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });

  const db = getDb();
  const filters = parseFilters(req);
  const { rows } = listAdminEvents(db, filters);

  const csvRows = rows.map((row) => {
    let payloadObject: Record<string, unknown> | null = null;
    try {
      payloadObject = row.payload ? (JSON.parse(row.payload) as Record<string, unknown>) : null;
    } catch {
      payloadObject = null;
    }

    const target = payloadObject && typeof payloadObject.target === "object" ? (payloadObject.target as Record<string, unknown>) : null;
    const action = payloadObject && typeof payloadObject.action === "object" ? (payloadObject.action as Record<string, unknown>) : null;

    return {
      event_id: row.event_id,
      ts: row.ts,
      iso_time: new Date(row.ts).toISOString(),
      participant_id: row.participant_id,
      session_id: row.session_id,
      turn_index: row.turn_index,
      event_type: row.event_type,
      page: row.page,
      client_ts: payloadObject?.client_ts ?? "",
      target_selector: payloadObject?.target_selector ?? "",
      action_selector: payloadObject?.action_selector ?? "",
      target_tag: target?.tag ?? "",
      target_text: target?.text ?? "",
      action_tag: action?.tag ?? "",
      action_text: action?.text ?? "",
      href: action?.href ?? target?.href ?? "",
      x: payloadObject?.x ?? "",
      y: payloadObject?.y ?? "",
      payload_json: row.payload ?? "",
    };
  });

  const csv = toCsv(csvRows, [
    "event_id",
    "ts",
    "iso_time",
    "participant_id",
    "session_id",
    "turn_index",
    "event_type",
    "page",
    "client_ts",
    "target_selector",
    "action_selector",
    "target_tag",
    "target_text",
    "action_tag",
    "action_text",
    "href",
    "x",
    "y",
    "payload_json",
  ]);

  const now = new Date();
  const filename = `web_experiment_events_${now.getFullYear()}${fmt(now.getMonth() + 1)}${fmt(now.getDate())}_${fmt(
    now.getHours(),
  )}${fmt(now.getMinutes())}${fmt(now.getSeconds())}.csv`;

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

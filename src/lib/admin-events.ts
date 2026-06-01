import type { Db } from "@/lib/db";

export type AdminEventFilters = {
  participantId?: string;
  sessionId?: string;
  eventType?: string;
  page?: string;
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
};

export type AdminEventRow = {
  event_id: string;
  ts: number;
  participant_id: string;
  session_id: string;
  turn_index: number;
  event_type: string;
  page: string | null;
  payload: string | null;
};

function normalizeLike(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;
  return `%${normalized}%`;
}

function normalizeEventType(value: string | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || normalized === "all") return null;
  return normalized;
}

export function normalizeDateInput(value: string | undefined, endOfDay = false): number | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  const suffix = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  const ts = Date.parse(`${normalized}${suffix}`);
  if (!Number.isFinite(ts)) return undefined;
  return ts;
}

export function normalizeLimit(value: string | undefined, fallback = 100): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(500, Math.max(1, Math.floor(numeric)));
}

function buildWhere(filters: AdminEventFilters) {
  const clauses: string[] = [];
  const params: Record<string, string | number> = {};

  if (filters.participantId?.trim()) {
    clauses.push("participant_id = @participantId");
    params.participantId = filters.participantId.trim();
  }
  if (filters.sessionId?.trim()) {
    clauses.push("session_id = @sessionId");
    params.sessionId = filters.sessionId.trim();
  }
  const eventType = normalizeEventType(filters.eventType);
  if (eventType) {
    clauses.push("event_type = @eventType");
    params.eventType = eventType;
  }
  const page = normalizeLike(filters.page);
  if (page) {
    clauses.push("page LIKE @page");
    params.page = page;
  }
  if (typeof filters.dateFrom === "number") {
    clauses.push("ts >= @dateFrom");
    params.dateFrom = filters.dateFrom;
  }
  if (typeof filters.dateTo === "number") {
    clauses.push("ts <= @dateTo");
    params.dateTo = filters.dateTo;
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export function listAdminEvents(db: Db, filters: AdminEventFilters): { rows: AdminEventRow[]; total: number } {
  const { whereSql, params } = buildWhere(filters);
  const limit = typeof filters.limit === "number" ? filters.limit : 100;

  const rows = db
    .prepare(
      `SELECT event_id, ts, participant_id, session_id, turn_index, event_type, page, payload
       FROM events
       ${whereSql}
       ORDER BY ts DESC
       LIMIT @limit`,
    )
    .all({ ...params, limit }) as AdminEventRow[];

  const total = db.prepare(`SELECT COUNT(*) AS count FROM events ${whereSql}`).get(params) as { count: number };
  return { rows, total: total.count };
}

export function listAdminEventTypes(db: Db): Array<{ event_type: string; count: number }> {
  return db
    .prepare(
      `SELECT event_type, COUNT(*) AS count
       FROM events
       GROUP BY event_type
       ORDER BY count DESC, event_type ASC`,
    )
    .all() as Array<{ event_type: string; count: number }>;
}

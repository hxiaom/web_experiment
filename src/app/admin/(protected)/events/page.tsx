"use client";

import { useEffect, useMemo, useState } from "react";
import { readJsonResponse } from "@/lib/client/api";

type EventTypeCount = {
  event_type: string;
  count: number;
};

type EventRow = {
  event_id: string;
  ts: number;
  participant_id: string;
  session_id: string;
  turn_index: number;
  event_type: string;
  page: string | null;
  payload: unknown;
};

type Filters = {
  participant_id: string;
  session_id: string;
  event_type: string;
  page: string;
  date_from: string;
  date_to: string;
  limit: string;
};

type EventsListResponse = {
  ok: boolean;
  events: EventRow[];
  event_types: EventTypeCount[];
  total: number;
  error?: string;
};

const DEFAULT_FILTERS: Filters = {
  participant_id: "",
  session_id: "",
  event_type: "ui_click",
  page: "",
  date_from: "",
  date_to: "",
  limit: "100",
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value.trim()) params.set(key, value.trim());
  }
  return params.toString();
}

function summarizePayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return payload == null ? "" : String(payload);
  const record = payload as Record<string, unknown>;
  const action = record.action && typeof record.action === "object" ? (record.action as Record<string, unknown>) : null;
  const target = record.target && typeof record.target === "object" ? (record.target as Record<string, unknown>) : null;
  const text = action?.text ?? target?.text ?? null;
  const selector = (record.action_selector as string | undefined) ?? (record.target_selector as string | undefined) ?? "";
  const xy =
    typeof record.x === "number" && typeof record.y === "number" ? ` @ (${Math.round(record.x)}, ${Math.round(record.y)})` : "";
  return [text, selector].filter(Boolean).join(" · ") + xy;
}

export default function AdminEventsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(nextFilters: Filters) {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery(nextFilters);
      const res = await fetch(`/api/admin/events/list${query ? `?${query}` : ""}`);
      const data = await readJsonResponse<EventsListResponse>(res);
      if (!res.ok || !data.ok) throw new Error(data?.error || "events_list_failed");
      setRows(data.events);
      setEventTypes(data.event_types);
      setTotal(data.total);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(DEFAULT_FILTERS).catch((err) => setError(String(err)));
  }, []);

  const exportHref = useMemo(() => {
    const query = buildQuery(filters);
    return `/api/admin/events/export${query ? `?${query}` : ""}`;
  }, [filters]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs tracking-widest text-zinc-500">EVENTS</div>
        <h1 className="mt-2 text-2xl font-semibold">行为日志查询与导出</h1>
        <div className="mt-2 text-sm text-zinc-600">
          当前可查询页面浏览、点击等行为记录，并导出当前筛选结果的 CSV。
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium">participant_id</label>
            <input
              value={filters.participant_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, participant_id: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              placeholder="e.g. p001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">session_id</label>
            <input
              value={filters.session_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, session_id: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              placeholder="可选"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">event_type</label>
            <select
              value={filters.event_type}
              onChange={(e) => setFilters((prev) => ({ ...prev, event_type: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              <option value="all">all</option>
              {eventTypes.map((item) => (
                <option key={item.event_type} value={item.event_type}>
                  {item.event_type} ({item.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">page contains</label>
            <input
              value={filters.page}
              onChange={(e) => setFilters((prev) => ({ ...prev, page: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              placeholder="/category/"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">date_from</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">date_to</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">limit</label>
            <input
              type="number"
              min="1"
              max="500"
              value={filters.limit}
              onChange={(e) => setFilters((prev) => ({ ...prev, limit: e.target.value }))}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => refresh(filters)}
              disabled={loading}
              className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "查询中..." : "查询"}
            </button>
            <a href={exportHref} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
              导出 CSV
            </a>
          </div>
        </div>
        {error ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs tracking-widest text-zinc-500">RESULTS</div>
          <div className="mt-2 text-3xl font-semibold">{total}</div>
          <div className="mt-1 text-sm text-zinc-600">符合当前筛选条件的记录总数</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:col-span-2">
          <div className="text-xs tracking-widest text-zinc-500">EVENT TYPES</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {eventTypes.map((item) => (
              <button
                key={item.event_type}
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, event_type: item.event_type }))}
                className="rounded-full border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
              >
                {item.event_type} · {item.count}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="text-sm font-medium">记录列表</div>
          <div className="text-sm text-zinc-500">当前返回 {rows.length} 条</div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3">time</th>
                <th className="px-4 py-3">participant</th>
                <th className="px-4 py-3">event_type</th>
                <th className="px-4 py-3">page</th>
                <th className="px-4 py-3">element</th>
                <th className="px-4 py-3">payload</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.event_id} className="border-t border-zinc-100 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-500">{new Date(row.ts).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{row.participant_id}</div>
                    <div className="mt-1 font-mono text-[11px] text-zinc-400">{row.session_id.slice(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.event_type}</div>
                    <div className="mt-1 text-xs text-zinc-400">turn {row.turn_index}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{row.page ?? ""}</td>
                  <td className="max-w-sm px-4 py-3 text-zinc-700">{summarizePayload(row.payload)}</td>
                  <td className="max-w-xl px-4 py-3">
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-zinc-50 p-3 text-[11px] leading-5 text-zinc-600">
                      {JSON.stringify(row.payload, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

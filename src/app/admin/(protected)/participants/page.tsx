"use client";

import { useEffect, useMemo, useState } from "react";
import { readJsonResponse } from "@/lib/client/api";

type ParticipantRow = { participant_id: string; cond: string; created_at: number; updated_at: number };
type ExperimentCond = "high" | "low" | "neutral";
type ParticipantsListResponse = { ok: boolean; participants: ParticipantRow[]; error?: string };
type ParticipantUpsertResponse = { ok: boolean; participant_id?: string; cond?: string; error?: string };

function isExperimentCond(value: string): value is ExperimentCond {
  return value === "high" || value === "low" || value === "neutral";
}

export default function AdminParticipantsPage() {
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [participantId, setParticipantId] = useState("");
  const [cond, setCond] = useState<ExperimentCond>("neutral");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/participants/list");
    const data = await readJsonResponse<ParticipantsListResponse>(res);
    if (!res.ok || !data.ok) throw new Error(data?.error || "list_failed");
    setRows(data.participants);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  async function upsert() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/participants/upsert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participant_id: participantId.trim(), cond }),
      });
      const data = await readJsonResponse<ParticipantUpsertResponse>(res);
      if (!res.ok || !data.ok) throw new Error(data?.error || "upsert_failed");
      setParticipantId("");
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const s = { high: 0, low: 0, neutral: 0 };
    for (const r of rows) {
      if (r.cond === "high") s.high++;
      else if (r.cond === "low") s.low++;
      else s.neutral++;
    }
    return s;
  }, [rows]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs tracking-widest text-zinc-500">PARTICIPANTS</div>
        <h1 className="mt-2 text-2xl font-semibold">分配实验条件</h1>
        <div className="mt-2 text-sm text-zinc-600">
          high: {stats.high} · low: {stats.low} · neutral: {stats.neutral} · total: {rows.length}
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">participant_id</label>
            <input
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              placeholder="e.g. P001"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">cond</label>
            <select
              value={cond}
              onChange={(e) => {
                if (isExperimentCond(e.target.value)) setCond(e.target.value);
              }}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              <option value="high">high</option>
              <option value="low">low</option>
              <option value="neutral">neutral</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              disabled={loading}
              onClick={upsert}
              className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
        {error ? <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div className="text-sm font-medium">列表（最多 1000）</div>
          <button
            onClick={() => refresh().catch((e) => setError(String(e)))}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            刷新
          </button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3">participant_id</th>
                <th className="px-4 py-3">cond</th>
                <th className="px-4 py-3">updated_at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.participant_id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-mono">{r.participant_id}</td>
                  <td className="px-4 py-3">{r.cond}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(r.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

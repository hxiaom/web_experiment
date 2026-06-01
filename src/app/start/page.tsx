"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = participantId.trim();
    if (!id) {
      setError("请输入 participant_id");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participant_id: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("未分配实验条件：请联系管理员在后台为该 participant_id 分配 high/low/neutral。");
        return;
      }
      localStorage.setItem("turn_index", "0");
      localStorage.removeItem("cart_v1");
      router.replace("/");
    } catch (err) {
      setError(`启动失败：${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-xs tracking-widest text-zinc-500">UNIQLO-STYLE</div>
          <h1 className="mt-2 text-xl font-semibold">实验入口</h1>
          <p className="mt-2 text-sm text-zinc-600">
            输入你的 <span className="font-mono">participant_id</span> 进入实验站点（需要管理员已分配条件）。
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">participant_id</label>
            <input
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              placeholder="e.g. P001"
              autoComplete="off"
            />
          </div>

          {error ? <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "进入中..." : "进入站点"}
          </button>
        </form>

        <div className="mt-6 text-xs text-zinc-500">
          免责声明：该站点仅用于研究模拟环境，不代表任何真实品牌或官方站点。
        </div>
      </div>
    </div>
  );
}

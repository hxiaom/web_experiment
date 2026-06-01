"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { readCart } from "@/lib/client/cart";
import { flush, track } from "@/lib/client/track";
import { getTurnIndex, setTurnIndex } from "@/lib/client/turn";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "你好，我是购物助手。你可以告诉我想买什么、预算、偏好颜色/版型/场景。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setLoading(true);
    const currentTurn = getTurnIndex();
    setMessages((m) => m.concat({ role: "user", content: text }));
    try {
      const cart = readCart();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          turn_index: currentTurn,
          client_context: {
            cart_items: cart.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessages((m) => m.concat({ role: "assistant", content: `（请求失败：${data?.error || res.status}）` }));
        return;
      }
      setMessages((m) => m.concat({ role: "assistant", content: data.reply }));
      setTurnIndex(Number(data.next_turn_index) || currentTurn + 1);
    } catch (e) {
      setMessages((m) => m.concat({ role: "assistant", content: `（网络异常：${String(e)}）` }));
    } finally {
      setLoading(false);
      flush().catch(() => {});
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[360px] max-w-[calc(100vw-2rem)]">
      {open ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div className="text-sm font-medium">AI 购物助手</div>
            <button
              className="text-xs text-zinc-500 hover:text-zinc-800"
              onClick={() => setOpen(false)}
            >
              关闭
            </button>
          </div>
          <div ref={listRef} className="max-h-[360px] space-y-3 overflow-auto px-4 py-3 text-sm">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-zinc-900 px-3 py-2 text-white"
                    : "mr-auto max-w-[85%] rounded-2xl bg-zinc-100 px-3 py-2 text-zinc-800"
                }
              >
                <div className="whitespace-pre-wrap leading-6">{m.content}</div>
              </div>
            ))}
            {loading ? <div className="text-xs text-zinc-500">生成中...</div> : null}
          </div>
          <div className="border-t border-zinc-200 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                    e.preventDefault();
                    send().catch(() => {});
                  }
                }}
                className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                placeholder="输入你的需求…（Enter 发送）"
              />
              <button
                disabled={!canSend}
                onClick={() => send().catch(() => {})}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                发送
              </button>
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              该对话用于研究模拟；请勿输入真实隐私信息。
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setOpen(true);
            track("chat_open", { at: Date.now() }, "chat");
          }}
          className="ml-auto flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          AI 助手
        </button>
      )}
    </div>
  );
}


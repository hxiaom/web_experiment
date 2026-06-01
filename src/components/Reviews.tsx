"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/client/track";

export default function Reviews({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const lastSent = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastSent.current < 1200) return;
      lastSent.current = now;
      track("review_scroll", { product_id: productId, scroll_top: el.scrollTop }, `/product/${productId}`);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [open, productId]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) track("review_expand", { product_id: productId }, `/product/${productId}`);
        }}
      >
        <div className="text-sm font-medium">商品评论（模拟）</div>
        <div className="text-xs text-zinc-500">{open ? "收起" : "展开"}</div>
      </button>

      {open ? (
        <div ref={scroller} className="max-h-56 space-y-3 overflow-auto border-t border-zinc-200 px-4 py-3 text-sm">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-zinc-50 px-3 py-2">
              <div className="text-xs text-zinc-500">用户{i + 1}</div>
              <div className="mt-1 text-zinc-700">版型合适，基础款百搭。面料触感不错，适合日常穿着。</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}


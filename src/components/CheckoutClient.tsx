"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cartTotal, readCart, type CartItem, writeCart } from "@/lib/client/cart";
import { track } from "@/lib/client/track";

export default function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setItems(readCart());
  }, []);

  const total = useMemo(() => cartTotal(items), [items]);

  if (done) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-sm font-medium">已完成（模拟）</div>
        <div className="mt-2 text-sm text-zinc-600">感谢参与。你可以继续浏览或关闭页面。</div>
        <Link href="/" className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-sm font-medium">订单摘要</div>
      <div className="mt-3 space-y-2 text-sm">
        {items.map((i) => (
          <div key={`${i.id}-${JSON.stringify(i.variant ?? {})}`} className="flex items-center justify-between">
            <div className="truncate">
              {i.name} × {i.qty}
            </div>
            <div className="font-semibold">¥{i.qty * i.price}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
        <div className="text-sm text-zinc-700">
          合计：<span className="text-lg font-semibold">¥{total}</span>
        </div>
        <button
          onClick={() => {
            track("checkout_complete", { total, cart_items: items }, "/checkout");
            writeCart([]);
            setItems([]);
            setDone(true);
          }}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          确认提交（模拟）
        </button>
      </div>
    </div>
  );
}


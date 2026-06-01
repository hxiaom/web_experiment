"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cartTotal, readCart, removeFromCart, updateQty, type CartItem } from "@/lib/client/cart";
import { track } from "@/lib/client/track";

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const current = readCart();
    setItems(current);
    track("cart_view", { cart_items: current.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })) }, "/cart");
  }, []);

  const total = useMemo(() => cartTotal(items), [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-sm text-zinc-600">购物车为空。</div>
        <Link href="/" className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          去逛逛
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium">商品</div>
        <div className="divide-y divide-zinc-100">
          {items.map((i) => (
            <div key={`${i.id}-${JSON.stringify(i.variant ?? {})}`} className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{i.name}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  id={i.id}
                  {i.variant?.color ? ` · ${i.variant.color}` : ""}
                  {i.variant?.size ? ` · ${i.variant.size}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">¥{i.price}</div>
                <input
                  value={i.qty}
                  onChange={(e) => {
                    const nextQty = Math.max(1, Math.floor(Number(e.target.value) || 1));
                    const next = updateQty(i.id, nextQty, i.variant);
                    setItems(next);
                    track("cart_qty_change", { product_id: i.id, qty: nextQty, cart_items: next }, "/cart");
                  }}
                  className="w-20 rounded-lg border border-zinc-300 px-2 py-1 text-sm"
                  inputMode="numeric"
                />
                <button
                  onClick={() => {
                    const next = removeFromCart(i.id, i.variant);
                    setItems(next);
                    track(
                      "remove_from_cart",
                      {
                        product_id: i.id,
                        cart_items: next.map((x) => ({ id: x.id, name: x.name, qty: x.qty, price: x.price })),
                      },
                      "/cart",
                    );
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-zinc-700">
          合计：<span className="text-lg font-semibold">¥{total}</span>
        </div>
        <Link
          href="/checkout"
          onClick={() => track("begin_checkout", { total, cart_items: items }, "/cart")}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          去结算
        </Link>
      </div>
    </div>
  );
}


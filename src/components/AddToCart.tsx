"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { addToCart, cartTotal, readCart } from "@/lib/client/cart";
import { track } from "@/lib/client/track";

export default function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState(product.sizes[2] ?? product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);

  const cartSummary = useMemo(() => {
    const items = readCart();
    return { count: items.reduce((s, i) => s + i.qty, 0), total: cartTotal(items) };
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">颜色</label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            {product.colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">尺码</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">数量</label>
          <input
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <button
          onClick={() => {
            const items = addToCart(product, qty, { color, size });
            track(
              "add_to_cart",
              {
                product_id: product.id,
                qty,
                variant: { color, size },
                cart_items: items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
              },
              `/product/${product.id}`,
            );
            router.push("/cart");
          }}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          加入购物车
        </button>
        <div className="text-xs text-zinc-500">
          当前购物车：{cartSummary.count} 件 · 合计 ¥{cartSummary.total}
        </div>
      </div>
    </section>
  );
}


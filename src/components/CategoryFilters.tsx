"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { track } from "@/lib/client/track";

export default function CategoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initial = useMemo(() => {
    return {
      gender: sp.get("gender") ?? "",
      color: sp.get("color") ?? "",
      size: sp.get("size") ?? "",
      minPrice: sp.get("minPrice") ?? "",
      maxPrice: sp.get("maxPrice") ?? "",
    };
  }, [sp]);

  function apply(formData: FormData) {
    const next = new URLSearchParams();
    const color = String(formData.get("color") ?? "").trim();
    const size = String(formData.get("size") ?? "").trim();
    const minPrice = String(formData.get("minPrice") ?? "").trim();
    const maxPrice = String(formData.get("maxPrice") ?? "").trim();

    if (initial.gender) next.set("gender", initial.gender);
    if (color) next.set("color", color);
    if (size) next.set("size", size);
    if (minPrice) next.set("minPrice", minPrice);
    if (maxPrice) next.set("maxPrice", maxPrice);

    track(
      "filter_change",
      { color: color || null, size: size || null, minPrice: minPrice || null, maxPrice: maxPrice || null },
      pathname,
    );
    router.push(`${pathname}?${next.toString()}`);
  }

  function reset() {
    track("filter_change", { reset: true }, pathname);
    router.push(initial.gender ? `${pathname}?gender=${initial.gender}` : pathname);
  }

  return (
    <form
      key={sp.toString()}
      className="rounded-2xl border border-zinc-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        apply(new FormData(event.currentTarget));
      }}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">颜色</label>
          <input
            name="color"
            defaultValue={initial.color}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            placeholder="白色/黑色…"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">尺码</label>
          <input
            name="size"
            defaultValue={initial.size}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            placeholder="S/M/L…"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">最低价</label>
          <input
            name="minPrice"
            defaultValue={initial.minPrice}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            placeholder="0"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">最高价</label>
          <input
            name="maxPrice"
            defaultValue={initial.maxPrice}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            placeholder="999"
            inputMode="numeric"
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
            应用
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            重置
          </button>
        </div>
      </div>
    </form>
  );
}

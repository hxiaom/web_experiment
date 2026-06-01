"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { GenderFilter } from "@/lib/products";

const OPTIONS: Array<{ value: GenderFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "men", label: "男装" },
  { value: "women", label: "女装" },
];

export default function GenderFilterTabs({ current }: { current: GenderFilter }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex rounded-2xl border border-zinc-200 bg-white p-1">
      {OPTIONS.map((option) => {
        const next = new URLSearchParams(searchParams.toString());
        if (option.value === "all") next.delete("gender");
        else next.set("gender", option.value);
        const href = next.toString() ? `${pathname}?${next.toString()}` : pathname;

        return (
          <Link
            key={option.value}
            href={href}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              current === option.value ? "bg-zinc-900 font-medium text-white" : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

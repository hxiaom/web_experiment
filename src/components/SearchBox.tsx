"use client";

import { useRouter } from "next/navigation";
import { track } from "@/lib/client/track";
import type { GenderFilter } from "@/lib/products";

export default function SearchBox({
  initialQuery,
  gender,
  className,
  inputClassName,
  buttonClassName,
  buttonLabel = "搜索",
}: {
  initialQuery: string;
  gender: GenderFilter;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  buttonLabel?: string;
}) {
  const router = useRouter();

  return (
    <form
      key={`${gender}-${initialQuery}`}
      className={className ?? "flex w-full max-w-md gap-2"}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const q = String(formData.get("q") ?? "").trim();
        const next = new URLSearchParams();
        next.set("q", q);
        if (gender !== "all") next.set("gender", gender);
        track("search_submit", { query: q, query_len: q.length, gender, source: "search_box" }, "/search");
        router.push(`/search?${next.toString()}`);
      }}
    >
      <input
        name="q"
        defaultValue={initialQuery ?? ""}
        className={
          inputClassName ??
          "flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        }
        placeholder="输入关键词…"
      />
      <button
        type="submit"
        className={buttonClassName ?? "rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"}
      >
        {buttonLabel}
      </button>
    </form>
  );
}

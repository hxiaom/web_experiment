"use client";

import { useEffect } from "react";
import { track } from "@/lib/client/track";

export default function SearchSubmitTracker({ query, resultsCount }: { query: string; resultsCount: number }) {
  useEffect(() => {
    const q = (query ?? "").trim();
    if (!q) return;
    const key = `search_results_view:${q}:${resultsCount}`;
    const last = sessionStorage.getItem(key);
    if (last === "1") return;
    sessionStorage.setItem(key, "1");
    track("search_results_view", { query: q, query_len: q.length, results_count: resultsCount }, "/search");
  }, [query, resultsCount]);
  return null;
}

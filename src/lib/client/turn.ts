const KEY = "turn_index";

export function getTurnIndex(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function setTurnIndex(next: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, String(Math.max(0, Math.floor(next))));
}


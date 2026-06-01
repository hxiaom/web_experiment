import { getTurnIndex } from "./turn";

type TrackEvent = {
  event_type: string;
  page?: string;
  payload?: unknown;
  turn_index: number;
};

let queue: TrackEvent[] = [];
let flushing = false;
let timer: number | null = null;

function scheduleFlush() {
  if (timer) return;
  timer = window.setTimeout(() => {
    timer = null;
    flush().catch(() => {});
  }, 1200);
}

export function track(event_type: string, payload?: unknown, page?: string) {
  if (typeof window === "undefined") return;
  const clientTs = Date.now();
  const enrichedPayload =
    payload && typeof payload === "object"
      ? { ...(payload as Record<string, unknown>), client_ts: clientTs }
      : payload === undefined
        ? { client_ts: clientTs }
        : { value: payload, client_ts: clientTs };
  queue.push({ event_type, payload: enrichedPayload, page, turn_index: getTurnIndex() });
  if (queue.length >= 20) {
    flush().catch(() => {});
  } else {
    scheduleFlush();
  }
}

export async function flush() {
  if (typeof window === "undefined") return;
  if (flushing) return;
  if (queue.length === 0) return;
  flushing = true;
  const batch = queue.slice(0, 50);
  queue = queue.slice(batch.length);
  try {
    const body = JSON.stringify({ events: batch });
    const okBeacon =
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    if (!okBeacon) {
      await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    queue = batch.concat(queue);
  } finally {
    flushing = false;
  }
}

export function installAutoFlush() {
  if (typeof window === "undefined") return;
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush().catch(() => {});
  });
  window.addEventListener("pagehide", () => flush().catch(() => {}));
}

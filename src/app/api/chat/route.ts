import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";
import { callChatCompletion } from "@/lib/llm";
import { formatSiteContext, getSystemPrompt, type Cond } from "@/lib/prompts";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

function normalizeCond(cond: string | null): Cond | null {
  if (cond === "high" || cond === "low" || cond === "neutral") return cond;
  return null;
}

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const raw = await req.text();
  let parsed: any;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const message = (parsed?.message ?? "").toString();
  const turnIndex = Number.isFinite(parsed?.turn_index) ? Math.max(0, Math.floor(parsed.turn_index)) : 0;
  if (!message || message.length > 2000) {
    return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }

  const db = getDb();
  const participant = db
    .prepare("SELECT participant_id, cond FROM participants WHERE participant_id = ?")
    .get(session.participantId) as { participant_id: string; cond: string | null } | undefined;
  const cond = normalizeCond(participant?.cond ?? null);
  if (!cond) return NextResponse.json({ ok: false, error: "participant_unassigned" }, { status: 403 });

  const recentChat = db
    .prepare(
      "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY ts DESC LIMIT 12",
    )
    .all(session.sessionId) as Array<{ role: string; content: string }>;

  const recentEvents = db
    .prepare(
      "SELECT event_type, payload FROM events WHERE session_id = ? AND event_type IN ('search_submit','product_view','add_to_cart','remove_from_cart','cart_view') ORDER BY ts DESC LIMIT 50",
    )
    .all(session.sessionId) as Array<{ event_type: string; payload: string | null }>;

  let lastSearchQuery: string | undefined;
  let lastViewedProductId: string | undefined;
  let cartItems: Array<{ id: string; name: string; qty: number; price: number }> | undefined;

  for (const e of recentEvents) {
    if (!e.payload) continue;
    let payload: any;
    try {
      payload = JSON.parse(e.payload);
    } catch {
      continue;
    }
    if (!lastSearchQuery && e.event_type === "search_submit" && typeof payload?.query === "string") {
      lastSearchQuery = payload.query.slice(0, 200);
    }
    if (!lastViewedProductId && e.event_type === "product_view" && typeof payload?.product_id === "string") {
      lastViewedProductId = payload.product_id;
    }
    if (!cartItems && Array.isArray(payload?.cart_items)) {
      cartItems = payload.cart_items
        .filter((i: any) => i && typeof i.id === "string" && typeof i.qty === "number")
        .slice(0, 20)
        .map((i: any) => ({
          id: i.id,
          name: typeof i.name === "string" ? i.name : i.id,
          qty: Math.max(1, Math.floor(i.qty)),
          price: typeof i.price === "number" ? i.price : 0,
        }));
    }
  }

  if (!cartItems && Array.isArray(parsed?.client_context?.cart_items)) {
    cartItems = parsed.client_context.cart_items
      .filter((i: any) => i && typeof i.id === "string" && typeof i.qty === "number")
      .slice(0, 20)
      .map((i: any) => ({
        id: i.id,
        name: typeof i.name === "string" ? i.name : i.id,
        qty: Math.max(1, Math.floor(i.qty)),
        price: typeof i.price === "number" ? i.price : 0,
      }));
  }

  const lastViewedProduct = lastViewedProductId ? getProductById(lastViewedProductId) : null;
  const cartSummary = cartItems
    ? {
        items: cartItems,
        total: cartItems.reduce((sum, i) => sum + i.qty * (i.price || 0), 0),
      }
    : undefined;

  const contextText = formatSiteContext({
    lastSearchQuery,
    lastViewedProduct: lastViewedProduct
      ? { id: lastViewedProduct.id, name: lastViewedProduct.name, category: lastViewedProduct.category, price: lastViewedProduct.price }
      : undefined,
    cartSummary,
  });

  const system = getSystemPrompt(cond);
  const history = recentChat
    .reverse()
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const messages = [
    { role: "system" as const, content: system },
    { role: "system" as const, content: contextText },
    ...history,
    { role: "user" as const, content: message },
  ];

  const model = process.env.LLM_MODEL || "";
  const now = Date.now();
  const userMessageId = randomUUID();
  db.prepare(
    "INSERT INTO chat_messages (message_id, ts, participant_id, session_id, turn_index, role, content, model, latency_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(userMessageId, now, session.participantId, session.sessionId, turnIndex, "user", message, model, null);

  let completion;
  try {
    completion = await callChatCompletion(messages);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "llm_error", detail: String(e?.message ?? e) }, { status: 502 });
  }

  const assistantMessageId = randomUUID();
  db.prepare(
    "INSERT INTO chat_messages (message_id, ts, participant_id, session_id, turn_index, role, content, model, latency_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    assistantMessageId,
    Date.now(),
    session.participantId,
    session.sessionId,
    turnIndex,
    "assistant",
    completion.content,
    model,
    completion.latencyMs,
  );

  const insertEvent = db.prepare(
    "INSERT INTO events (event_id, ts, participant_id, session_id, turn_index, event_type, page, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const updateSession = db.prepare("UPDATE sessions SET last_seen_at = ? WHERE session_id = ?");
  updateSession.run(Date.now(), session.sessionId);
  insertEvent.run(
    randomUUID(),
    Date.now(),
    session.participantId,
    session.sessionId,
    turnIndex,
    "chat_message_user",
    "chat",
    JSON.stringify({ message_id: userMessageId, content_len: message.length }),
  );
  insertEvent.run(
    randomUUID(),
    Date.now(),
    session.participantId,
    session.sessionId,
    turnIndex,
    "chat_message_assistant",
    "chat",
    JSON.stringify({ message_id: assistantMessageId, content_len: completion.content.length, request_id: completion.requestId }),
  );

  return NextResponse.json({
    ok: true,
    reply: completion.content,
    next_turn_index: turnIndex + 1,
    request_id: completion.requestId,
    latency_ms: completion.latencyMs,
  });
}

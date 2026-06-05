import { optionalEnv, requireEnv } from "./env";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatCompletionResponse = {
  id?: string;
  choices?: Array<{ message?: { role?: string; content?: string } }>;
};

function chatCompletionsUrl(baseUrl: string): string {
  const normalized = baseUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  if (normalized.endsWith("/v1")) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

export async function callChatCompletion(messages: ChatMessage[]): Promise<{
  content: string;
  requestId?: string;
  latencyMs: number;
}> {
  const baseUrl = requireEnv("LLM_BASE_URL");
  const apiKey = requireEnv("LLM_API_KEY");
  const model = requireEnv("LLM_MODEL");

  const url = chatCompletionsUrl(baseUrl);
  const controller = new AbortController();
  const timeoutMs = Number(optionalEnv("LLM_TIMEOUT_MS") ?? "30000");
  const started = Date.now();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
      }),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`LLM request failed: ${res.status} ${res.statusText} ${text.slice(0, 300)}`);
    }
    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("LLM returned empty content");
    return { content, requestId: data.id, latencyMs };
  } finally {
    clearTimeout(t);
  }
}

import type { CatalogModel, ChatMessage, KeyInfo, Role } from "../types";

export const OR_BASE = "https://openrouter.ai/api/v1";

function headers(key: string): Record<string, string> {
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": typeof window === "undefined" ? "https://merqato.ai" : window.location.origin,
    "X-Title": "MERQATO Agent OS",
  };
}

interface RawModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

function mapModel(m: RawModel): CatalogModel {
  const prompt = Number(m.pricing?.prompt ?? 0) || 0;
  const completion = Number(m.pricing?.completion ?? 0) || 0;
  return {
    id: m.id,
    name: m.name || m.id,
    provider: m.id.includes("/") ? m.id.split("/")[0] : "openrouter",
    source: "openrouter",
    free: prompt === 0 && completion === 0,
    contextLength: m.context_length ?? 0,
    promptPerM: prompt * 1_000_000,
    completionPerM: completion * 1_000_000,
    description: m.description ?? "",
  };
}

/** Public catalog — no API key required. */
export async function fetchModels(): Promise<CatalogModel[]> {
  const res = await fetch(`${OR_BASE}/models`);
  if (!res.ok) throw new Error(`Model catalog unavailable (HTTP ${res.status})`);
  const json = (await res.json()) as { data?: RawModel[] };
  const list = (json.data ?? []).map(mapModel);
  list.sort((a, b) => {
    if (a.free !== b.free) return a.free ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return list;
}

/** Validates the key and returns credit information. */
export async function verifyKey(key: string): Promise<KeyInfo> {
  const res = await fetch(`${OR_BASE}/key`, { headers: headers(key) });
  if (res.status === 401) throw new Error("Invalid API key");
  if (!res.ok) throw new Error(`Key check failed (HTTP ${res.status})`);
  const json = (await res.json()) as {
    data?: {
      label?: string;
      usage?: number;
      limit?: number | null;
      limit_remaining?: number | null;
      is_free_tier?: boolean;
      rate_limit?: { requests: number; interval: string };
    };
  };
  const d = json.data ?? {};
  return {
    label: d.label || "OpenRouter key",
    usage: d.usage ?? 0,
    limit: d.limit ?? null,
    limitRemaining: d.limit_remaining ?? null,
    isFreeTier: Boolean(d.is_free_tier),
    rateLimit: d.rate_limit,
  };
}

export interface ChatTurn {
  role: Role;
  content: string;
}

export interface StreamResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  model: string;
}

export async function streamChat(opts: {
  apiKey: string;
  model: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}): Promise<StreamResult> {
  const started = performance.now();
  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: "POST",
    headers: headers(opts.apiKey),
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = (await res.json()) as { error?: { message?: string } };
      if (err?.error?.message) detail = err.error.message;
    } catch {
      /* keep status */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let promptTokens = 0;
  let completionTokens = 0;
  let usedModel = opts.model;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload) as {
          model?: string;
          choices?: { delta?: { content?: string }; finish_reason?: string }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
          error?: { message?: string };
        };
        if (json.error?.message) throw new Error(json.error.message);
        if (json.model) usedModel = json.model;
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          content += delta;
          opts.onDelta(delta);
        }
        if (json.usage) {
          promptTokens = json.usage.prompt_tokens ?? promptTokens;
          completionTokens = json.usage.completion_tokens ?? completionTokens;
        }
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }

  return {
    content,
    promptTokens,
    completionTokens,
    latencyMs: Math.round(performance.now() - started),
    model: usedModel,
  };
}

export function estimateCost(model: CatalogModel | undefined, promptTokens: number, completionTokens: number) {
  if (!model) return 0;
  return (promptTokens / 1_000_000) * model.promptPerM + (completionTokens / 1_000_000) * model.completionPerM;
}

export function toChatTurns(messages: ChatMessage[]): ChatTurn[] {
  return messages
    .filter((m) => !m.error && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

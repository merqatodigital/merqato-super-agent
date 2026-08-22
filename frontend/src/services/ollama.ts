import type { CatalogModel } from "../types";
import type { ChatTurn, StreamResult } from "./openrouter";

export async function fetchOllamaModels(base: string): Promise<CatalogModel[]> {
  const root = base.replace(/\/$/, "");
  const res = await fetch(`${root}/api/tags`);
  if (!res.ok) throw new Error(`Ollama unavailable (HTTP ${res.status})`);
  const json = (await res.json()) as { models?: { name: string; details?: { parameter_size?: string } }[] };
  return (json.models ?? []).map((m) => ({
    id: `ollama/${m.name}`,
    name: m.name,
    provider: "ollama",
    source: "ollama" as const,
    free: true,
    contextLength: 0,
    promptPerM: 0,
    completionPerM: 0,
    description: m.details?.parameter_size ? `Local model · ${m.details.parameter_size}` : "Local model",
  }));
}

export async function streamOllama(opts: {
  base: string;
  model: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
  onDelta: (chunk: string) => void;
}): Promise<StreamResult> {
  const started = performance.now();
  const root = opts.base.replace(/\/$/, "");
  const res = await fetch(`${root}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      model: opts.model.replace(/^ollama\//, ""),
      messages: opts.messages,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama error (HTTP ${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let promptTokens = 0;
  let completionTokens = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed) as {
          message?: { content?: string };
          prompt_eval_count?: number;
          eval_count?: number;
        };
        const delta = json.message?.content;
        if (delta) {
          content += delta;
          opts.onDelta(delta);
        }
        if (json.prompt_eval_count) promptTokens = json.prompt_eval_count;
        if (json.eval_count) completionTokens = json.eval_count;
      } catch {
        continue;
      }
    }
  }

  return {
    content,
    promptTokens,
    completionTokens,
    latencyMs: Math.round(performance.now() - started),
    model: opts.model,
  };
}

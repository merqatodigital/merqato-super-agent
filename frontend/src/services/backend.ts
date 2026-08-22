/**



 * Optional MERQATO backend connection point.



 *



 * The frontend works fully standalone: when `VITE_API_BASE_URL` is not set,



 * nothing in here runs and the app keeps talking to OpenRouter / Ollama



 * directly from the browser (see `openrouter.ts` and `ollama.ts`).



 *



 * Only the three routes the FastAPI service actually implements today are



 * declared. No other endpoints are assumed to exist.



 *



 *   GET  /health



 *   POST /api/clients



 *   GET  /api/clients/{id}



 */







import type { BusinessInfo, OperatorInfo, CatalogModel } from "../types";
import type { ChatTurn, StreamResult } from "./openrouter";







export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");







/** True when a backend URL was provided at build time. */



export const backendConfigured = API_BASE_URL.length > 0;







export interface HealthResponse {



  status?: string;



  [key: string]: unknown;



}







/** Mirrors the payload accepted by POST /api/clients. */



export interface ClientPayload {



  name: string;



  legal_name?: string;



  industry?: string;



  size?: string;



  website?: string;



  email?: string;



  phone?: string;



  address_line1?: string;



  address_line2?: string;



  city?: string;



  region?: string;



  postal_code?: string;



  country?: string;



  tax_id?: string;



  timezone?: string;



  description?: string;



  operator_name?: string;



  operator_role?: string;



  operator_email?: string;



  operator_phone?: string;



  telegram_handle?: string;



}







export interface ClientRecord extends ClientPayload {



  id: string | number;



  [key: string]: unknown;



}







export class BackendError extends Error {



  constructor(



    message: string,



    readonly status?: number,



  ) {



    super(message);



    this.name = "BackendError";



  }



}







function requireBase(): string {



  if (!backendConfigured) {



    throw new BackendError("No backend configured. Set VITE_API_BASE_URL to enable this.");



  }



  return API_BASE_URL;



}







async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {



  const base = requireBase();



  const controller = new AbortController();



  const timeout = window.setTimeout(() => controller.abort(), init?.timeoutMs ?? 10_000);







  try {



    const res = await fetch(`${base}${path}`, {



      ...init,



      signal: controller.signal,



      headers: {



        Accept: "application/json",



        ...(init?.body ? { "Content-Type": "application/json" } : {}),



        ...(init?.headers ?? {}),



      },



    });







    if (!res.ok) {



      let detail = `HTTP ${res.status}`;



      try {



        const body = (await res.json()) as { detail?: unknown };



        if (typeof body?.detail === "string") detail = body.detail;



      } catch {



        /* non-JSON error body — keep the status text */



      }



      throw new BackendError(detail, res.status);



    }







    if (res.status === 204) return undefined as T;



    return (await res.json()) as T;



  } catch (err) {



    if (err instanceof BackendError) throw err;



    if (err instanceof DOMException && err.name === "AbortError") {



      throw new BackendError("Request timed out");



    }



    throw new BackendError(err instanceof Error ? err.message : "Network error");



  } finally {



    window.clearTimeout(timeout);



  }



}







export const backend = {



  configured: backendConfigured,



  baseUrl: API_BASE_URL,







  /** GET /health — liveness probe. */



  health(): Promise<HealthResponse> {



    return request<HealthResponse>("/health", { method: "GET", timeoutMs: 5000 });



  },







  /** POST /api/clients — create a client record. */



  createClient(payload: ClientPayload): Promise<ClientRecord> {



    return request<ClientRecord>("/api/clients", {



      method: "POST",



      body: JSON.stringify(payload),



    });



  },







  /** GET /api/clients/{id} — fetch a single client record. */



  getClient(id: string | number): Promise<ClientRecord> {



    return request<ClientRecord>(`/api/clients/${encodeURIComponent(String(id))}`, { method: "GET" });



  },







  /** GET /api/hermes/status — Hermes runtime status. */



  hermesStatus(clientId?: string): Promise<{ running: boolean; profile?: string; profile_exists?: boolean; distribution_version?: string; note?: string }> {



    const params = new URLSearchParams();



    if (clientId) params.set("client_id", clientId);



    return request<any>(`/api/hermes/status?${params}`, { method: "GET" });



  },







  /** GET /api/models/openrouter — list OpenRouter models. */



  listOpenRouterModels(): Promise<{ models: Array<{



    id: string; name: string; provider: string; source: string;



    free: boolean; context_length: number; prompt_per_m: number;



    completion_per_m: number; description: string;



  }> }> {



    return request<any>(`/api/models/openrouter`, { method: "GET" });



  },







  /** GET /api/models/ollama — list Ollama models. */



  listOllamaModels(baseUrl?: string): Promise<{ models: Array<{



    id: string; name: string; provider: string; source: string;



    free: boolean; context_length: number; prompt_per_m: number;



    completion_per_m: number; description: string;



  }> }> {



    const params = new URLSearchParams();



    if (baseUrl) params.set("base_url", baseUrl);



    return request<any>(`/api/models/ollama?${params}`, { method: "GET" });



  },







  /** POST /api/openai/verify — verify OpenRouter API key. */



  verifyOpenRouterKey(apiKey: string): Promise<{ valid: boolean; label?: string; usage?: number; limit?: number | null; limit_remaining?: number | null; error?: string }> {
    return request<any>(`/api/openai/verify`, {
      method: "POST",



      body: JSON.stringify({ api_key: apiKey }),



    });



  },







  /** POST /api/chat/stream — stream a chat response via SSE. */



  async streamChat(opts: {



    model: CatalogModel | undefined;



    modelId: string;



    apiKey: string



    ollamaUrl: string;



    messages: ChatTurn[];



    signal?: AbortSignal;



    onDelta: (chunk: string) => void;



  }): Promise<StreamResult> {



    const params = new URLSearchParams();



    params.set("client_id", "current"); // In production, use real client ID



    params.set("message", opts.messages[opts.messages.length - 1]?.content || "");



    if (opts.modelId) params.set("model", opts.modelId);



    



    const controller = new AbortController();



    if (opts.signal) opts.signal.addEventListener("abort", () => controller.abort());



    



    const timeout = window.setTimeout(() => controller.abort(), 300_000);



    



    const base = API_BASE_URL || "";



    const res = await fetch(`${base}/api/chat/stream?${params}`, {



      method: "POST",



      headers: { Accept: "text/event-stream" },



      signal: controller.signal,



    });



    



    clearTimeout(timeout);



    



    if (!res.ok) {



      const text = await res.text();



      throw new Error(`Chat stream failed: ${res.status} ${text}`);



    }



    



    if (!res.body) {
      throw new Error("Response body is null");
    }
    const reader = res.body.getReader();



    const decoder = new TextDecoder();



    let buffer = "";



    let fullContent = "";



    



    try {



      while (true) {



        const { done, value } = await reader.read();



        if (done) break;



        



        buffer += decoder.decode(value, { stream: true });



        const lines = buffer.split("\n\n");



        buffer = lines.pop() ?? "";



        



        for (const line of lines) {



          if (line.startsWith("data: ")) {



            const data = line.slice(6);



            if (data === "[DONE]") return { content: fullContent, promptTokens: 0, completionTokens: 0, latencyMs: 0, model: opts.modelId };



            if (data.startsWith("ERROR:")) throw new Error(data.slice(6));



            fullContent += data;



            opts.onDelta(data);



          }



        }



      }



    } finally {



      if (opts.signal) opts.signal.removeEventListener("abort", () => controller.abort());



    }



    



    return { content: fullContent, promptTokens: 0, completionTokens: 0, latencyMs: 0, model: opts.modelId };



  },



};







/** Maps the local company/operator profile onto the backend client payload. */



export function toClientPayload(input: {



  business: BusinessInfo;



  operator: OperatorInfo;



  telegramHandle: string;



}): ClientPayload {



  const b = input.business;



  const o = input.operator;



  const clean = (v: string) => (v && v.trim() ? v.trim() : undefined);



  return {



    name: b.name,



    legal_name: clean(b.legalName),



    industry: clean(b.industry),



    size: clean(b.size),



    website: clean(b.website),



    email: clean(b.email),



    phone: clean(b.phone),



    address_line1: clean(b.addressLine1),



    address_line2: clean(b.addressLine2),



    city: clean(b.city),



    region: clean(b.region),



    postal_code: clean(b.postalCode),



    country: clean(b.country),



    tax_id: clean(b.taxId),



    timezone: clean(b.timezone),



    description: clean(b.description),



    operator_name: clean(o.name),



    operator_role: clean(o.role),



    operator_email: clean(o.email),



    operator_phone: clean(o.phone),



    telegram_handle: clean(input.telegramHandle),



  };



}



/** POST /api/clients/{id}/documents — upload a document for FTS indexing. */

export async function uploadDocumentToBackend(clientId: string, file: File): Promise<{ id: string }> {
  const base = requireBase();

  const formData = new FormData();

  formData.append("file", file);

  const res = await fetch(`${base}/api/clients/${encodeURIComponent(clientId)}/documents`, {

    method: "POST",

    headers: {

      Authorization: `Bearer ${import.meta.env.VITE_ADMIN_TOKEN ?? ""}`,

    },

    body: formData,

  });

  if (!res.ok) {

    const text = await res.text();

    throw new BackendError(`Document upload failed: ${res.status} ${text}`, res.status);

  }

  return res.json() as Promise<{ id: string }>;

}



/** GET /api/clients/{id}/knowledge/search?q= — full-text search across indexed documents. */

export async function searchKnowledge(clientId: string, query: string): Promise<Array<{ document_id: string; title: string; snippet: string; rank: number }>> {
  const base = requireBase();

  const params = new URLSearchParams({ q: query });

  const res = await fetch(`${base}/api/clients/${encodeURIComponent(clientId)}/knowledge/search?${params}`, {

    headers: {

      Accept: "application/json",

      Authorization: `Bearer ${import.meta.env.VITE_ADMIN_TOKEN ?? ""}`,

    },

  });

  if (!res.ok) {

    const text = await res.text();

    throw new BackendError(`Knowledge search failed: ${res.status} ${text}`, res.status);

  }

  return res.json() as Promise<Array<{ document_id: string; title: string; snippet: string; rank: number }>>;

}
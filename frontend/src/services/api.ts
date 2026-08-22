/**

 * Single frontend service boundary.

 *

 * Today this talks directly to OpenRouter / Ollama from the browser and keeps

 * workspace state in localStorage. When the FastAPI + Hermes backend is ready,

 * only the functions in this file need to change: swap the `provider.*` calls

 * for `fetch(`${API_BASE}/...`)` and keep every component untouched.

 */

import type {

  Agent,

  CatalogModel,

  KeyInfo,

  PersistedState,

  Settings,

  SyncState,

} from "../types";

import {

  estimateCost,

  fetchModels,

  OR_BASE,

  streamChat,

  verifyKey,

  type ChatTurn,

  type StreamResult,

} from "./openrouter";

import { fetchOllamaModels, streamOllama } from "./ollama";



const STORAGE_KEY = "merqato.workspace.v2";



export const DEFAULT_SYSTEM_PROMPT = `You are HERMES, the Super Agent inside MERQATO Agent OS.

You execute operational missions for the business you serve.

Be direct, concrete and concise. Use short paragraphs and bullet lists.

State assumptions explicitly. If information is missing, ask one focused question.

Never invent data, metrics, files or system capabilities you do not have.`;



export function createSuperAgent(): Agent {

  return {

    id: "hermes",

    name: "HERMES",

    role: "Operations",

    kind: "super-agent",

    icon: "hermes",

    enabled: true,

    model: "",

    systemPrompt: DEFAULT_SYSTEM_PROMPT,

    tools: ["knowledge", "memory", "approvals"],

    createdAt: Date.now(),

  };

}



export const defaultSettings: Settings = {

  plan: "free",

  provider: "ollama",

  apiKey: "",

  ollamaUrl: "http://localhost:11434",

  defaultModel: "",

  routerModels: [],

  showFreeOnly: false,

  autoSyncModels: true,

  syncIntervalHours: 24,

  telegramHandle: "",

  telegramConfigured: false,

  telegramVerified: false,

  business: {

    name: "",

    legalName: "",

    industry: "",

    size: "",

    website: "",

    email: "",

    phone: "",

    addressLine1: "",

    addressLine2: "",

    city: "",

    region: "",

    postalCode: "",

    country: "",

    taxId: "",

    timezone: typeof Intl !== "undefined" ? (Intl.DateTimeFormat().resolvedOptions().timeZone ?? "") : "",

    description: "",

  },

  operator: { name: "", role: "", email: "", phone: "" },

  onboardingComplete: false,

  onboardingCompletedAt: null,

  clientId: "",

};



export function emptySync(): SyncState {

  return {

    snapshot: null,

    lastDiff: null,

    lastSyncedAt: null,

    lastAttemptAt: null,

    lastError: "",

    source: `${OR_BASE}/models`,

  };

}



export function emptyState(): PersistedState {

  return {

    settings: { ...defaultSettings },

    agents: [createSuperAgent()],

    messages: [],

    runs: [],

    activity: [],

    docs: [],

    memory: [],

    sync: emptySync(),

  };

}



export const storage = {

  load(): PersistedState {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return emptyState();

      const parsed = JSON.parse(raw) as Partial<PersistedState>;

      const base = emptyState();

      const saved = (parsed.settings ?? {}) as Partial<Settings> & {

        operatorName?: string;

        operatorEmail?: string;

      };

      return {

        settings: {

          ...base.settings,

          ...saved,

          // Nested records must be deep-merged so older workspaces gain new fields.

          business: { ...base.settings.business, ...(saved.business ?? {}) },

          operator: {

            ...base.settings.operator,

            // Carry forward the pre-v3 flat operator fields.

            ...(saved.operatorName ? { name: saved.operatorName } : {}),

            ...(saved.operatorEmail ? { email: saved.operatorEmail } : {}),

            ...(saved.operator ?? {}),

          },

        },

        agents: parsed.agents?.length ? parsed.agents : base.agents,

        messages: parsed.messages ?? [],

        runs: parsed.runs ?? [],

        activity: parsed.activity ?? [],

        docs: parsed.docs ?? [],

        memory: parsed.memory ?? [],

        sync: { ...base.sync, ...(parsed.sync ?? {}) },

      };

    } catch {

      return emptyState();

    }

  },

  save(state: PersistedState) {

    try {

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    } catch {

      /* quota exceeded — state stays in memory */

    }

  },

  clear() {

    localStorage.removeItem(STORAGE_KEY);

  },

};



export const provider = {

  /** Live OpenRouter catalog (free + paid). No key required. */

  listOpenRouterModels(): Promise<CatalogModel[]> {

    return fetchModels();

  },

  /** Local Ollama catalog. */

  listOllamaModels(base: string): Promise<CatalogModel[]> {

    return fetchOllamaModels(base);

  },

  /** Validates a real OpenRouter key and returns credit info. */

  verifyOpenRouterKey(key: string): Promise<KeyInfo> {

    return verifyKey(key);

  },

  /** Streams a completion from whichever provider owns the model. */

  run(opts: {

    model: CatalogModel | undefined;

    modelId: string;

    apiKey: string;

    ollamaUrl: string;

    messages: ChatTurn[];

    signal?: AbortSignal;

    onDelta: (chunk: string) => void;

  }): Promise<StreamResult> {

    if (opts.model?.source === "ollama" || opts.modelId.startsWith("ollama/")) {

      return streamOllama({

        base: opts.ollamaUrl,

        model: opts.modelId,

        messages: opts.messages,

        signal: opts.signal,

        onDelta: opts.onDelta,

      });

    }

    if (!opts.apiKey) throw new Error("Add your OpenRouter API key in Settings first.");

    return streamChat({

      apiKey: opts.apiKey,

      model: opts.modelId,

      messages: opts.messages,

      signal: opts.signal,

      onDelta: opts.onDelta,

    });

  },

  cost: estimateCost,

};



export type { ChatTurn, StreamResult };


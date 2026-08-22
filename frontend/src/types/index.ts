export type PageId =
  | "command-center"
  | "super-agent"
  | "bots"
  | "tasks"
  | "browser"
  | "knowledge"
  | "memory"
  | "approvals"
  | "usage"
  | "settings";

export type ModelSource = "openrouter" | "ollama";

export interface CatalogModel {
  id: string;
  name: string;
  provider: string;
  source: ModelSource;
  free: boolean;
  contextLength: number;
  /** USD per 1M prompt tokens */
  promptPerM: number;
  /** USD per 1M completion tokens */
  completionPerM: number;
  description: string;
}

export interface SnapshotModel {
  id: string;
  name: string;
  promptPerM: number;
  completionPerM: number;
  free: boolean;
}

export interface CatalogSnapshot {
  fetchedAt: number;
  models: SnapshotModel[];
}

export interface CatalogChange {
  id: string;
  name: string;
  kind: "added" | "removed" | "became_free" | "became_paid" | "price_up" | "price_down";
  detail: string;
}

export interface CatalogDiff {
  at: number;
  prevCount: number;
  nextCount: number;
  baseline: boolean;
  changes: CatalogChange[];
}

export interface SyncState {
  snapshot: CatalogSnapshot | null;
  lastDiff: CatalogDiff | null;
  lastSyncedAt: number | null;
  lastAttemptAt: number | null;
  lastError: string;
  source: string;
}

export type ConnState = "idle" | "checking" | "connected" | "error";

export interface Connection {
  state: ConnState;
  detail: string;
  checkedAt: number | null;
}

export interface KeyInfo {
  label: string;
  usage: number;
  limit: number | null;
  limitRemaining: number | null;
  isFreeTier: boolean;
  rateLimit?: { requests: number; interval: string };
}

export type BotKind = "super-agent" | "specialist";

export interface Agent {
  id: string;
  name: string;
  role: string;
  kind: BotKind;
  icon: string;
  enabled: boolean;
  /** Catalog model id, empty = inherit default */
  model: string;
  systemPrompt: string;
  tools: string[];
  createdAt: number;
}

export type Role = "system" | "user" | "assistant";

/** A file attached to a chat turn. The text also lands in Knowledge. */
export interface Attachment {
  id: string;
  name: string;
  bytes: number;
  type: string;
  /** False when the file is binary and needs backend parsing. */
  readable: boolean;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  ts: number;
  model?: string;
  tokens?: number;
  cost?: number;
  latencyMs?: number;
  error?: boolean;
  pending?: boolean;
}

export type RunStatus = "pending_approval" | "running" | "completed" | "failed" | "rejected";

export interface Run {
  id: string;
  title: string;
  prompt: string;
  agentId: string;
  model: string;
  status: RunStatus;
  createdAt: number;
  finishedAt: number | null;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  latencyMs: number;
  output: string;
  error: string;
  requiresApproval: boolean;
}

export interface ActivityItem {
  id: string;
  agentId: string;
  message: string;
  ts: number;
  tone: "ok" | "warn" | "info";
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  bytes: number;
  addedAt: number;
  chars: number;
  text: string;
  includeInContext: boolean;
  /** "upload" from Knowledge, or the agent id it was attached to in chat. */
  source?: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  agentId: string;
  createdAt: number;
  pinned: boolean;
}

/** Complete company record. Captured lightly at onboarding, fully editable in Settings. */
export interface BusinessInfo {
  name: string;
  legalName: string;
  industry: string;
  size: string;
  website: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  taxId: string;
  timezone: string;
  description: string;
}

/** The person operating the workspace. */
export interface OperatorInfo {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export type Plan = "free" | "pro";

/** Free plan runs the single Super Agent. Specialist bots are a paid upgrade. */
export const PLAN_LIMITS: Record<Plan, { specialistBots: number; label: string }> = {
  free: { specialistBots: 0, label: "Starter" },
  pro: { specialistBots: 12, label: "Pro" },
};

/** Which inference provider the workspace was set up against. */
export type ProviderChoice = "openrouter" | "ollama";

export interface Settings {
  plan: Plan;
  provider: ProviderChoice;
  apiKey: string;
  ollamaUrl: string;
  defaultModel: string;
  routerModels: string[];
  showFreeOnly: boolean;
  autoSyncModels: boolean;
  syncIntervalHours: number;
  telegramHandle: string;
  /** A handle has been saved locally. This is NOT proof of a live connection. */
  telegramConfigured: boolean;
  /** Only ever set by a verified backend round-trip. */
  telegramVerified: boolean;
  business: BusinessInfo;
  operator: OperatorInfo;
  /** Set once the wizard finishes. Never re-shown; Settings is the record of truth. */
  onboardingComplete: boolean;
  onboardingCompletedAt: number | null;
  /** UUID returned by the FastAPI backend after client registration. */
  clientId: string;
}

export interface Toast {
  id: string;
  title: string;
  detail?: string;
  tone?: "ok" | "warn" | "info";
}

export interface PersistedState {
  settings: Settings;
  agents: Agent[];
  messages: ChatMessage[];
  runs: Run[];
  activity: ActivityItem[];
  docs: KnowledgeDoc[];
  memory: MemoryEntry[];
  sync: SyncState;
}

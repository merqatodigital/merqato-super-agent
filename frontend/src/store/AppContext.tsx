import {



  createContext,



  useCallback,



  useContext,



  useEffect,



  useMemo,



  useRef,



  useState,



  type ReactNode,



} from "react";



import { createSuperAgent, defaultSettings, emptyState, emptySync, provider, storage } from "../services/api";



import type { ChatTurn } from "../services/api";



import { diffCatalog, isStale, toSnapshot } from "../services/catalog";



import { PLAN_LIMITS } from "../types";



import { backend, backendConfigured, uploadDocumentToBackend } from "../services/backend";



import type {



  ActivityItem,



  Agent,



  Attachment,



  CatalogModel,



  ChatMessage,



  Connection,



  KeyInfo,



  KnowledgeDoc,



  MemoryEntry,



  PageId,



  Run,



  Settings,



  SyncState,



  Toast,



} from "../types";







const idle: Connection = { state: "idle", detail: "Not configured", checkedAt: null };







interface AppState {



  ready: boolean;



  page: PageId;



  setPage: (page: PageId) => void;







  settings: Settings;



  updateSettings: (patch: Partial<Settings>) => void;







  agents: Agent[];



  messages: ChatMessage[];



  runs: Run[];



  activity: ActivityItem[];



  docs: KnowledgeDoc[];



  memory: MemoryEntry[];







  catalog: CatalogModel[];



  catalogLoading: boolean;



  catalogError: string;



  sync: SyncState;



  catalogStale: boolean;



  activeModelIssue: string;



  openrouter: Connection;



  ollama: Connection;



  keyInfo: KeyInfo | null;







  streamingAgentId: string | null;



  toasts: Toast[];



  drawer: "agent" | "run" | "bot-create" | null;



  selectedAgentId: string | null;



  selectedRunId: string | null;







  /** True only when a model is selected AND its provider is actually usable. */



  hermesReady: boolean;



  readyDetail: string;



  canAddBot: boolean;



  botAllowance: number;



  specialistCount: number;



  upgradeOpen: boolean;



  setUpgradeOpen: (open: boolean) => void;



  upgradePlan: () => void;



  downgradePlan: () => void;







  modelById: (id: string) => CatalogModel | undefined;



  modelForAgent: (agent: Agent) => string;



  freeModels: CatalogModel[];



  paidModels: CatalogModel[];







  refreshCatalog: () => Promise<void>;



  testOpenRouter: (key?: string) => Promise<boolean>;



  testOllama: () => Promise<boolean>;







  sendMessage: (



    agentId: string,



    text: string,



    opts?: { requireApproval?: boolean; files?: File[] },



  ) => Promise<void>;



  stopStream: () => void;



  approveRun: (runId: string) => Promise<void>;



  rejectRun: (runId: string) => void;



  clearConversation: (agentId: string) => void;







  createBot: (input: { name: string; role: string; systemPrompt: string; model: string }) => void;



  updateAgent: (id: string, patch: Partial<Agent>) => void;



  deleteAgent: (id: string) => void;







  addDocs: (files: File[], source?: string) => Promise<Attachment[]>;



  removeDoc: (id: string) => void;



  toggleDoc: (id: string) => void;







  addMemory: (content: string, agentId: string) => void;



  removeMemory: (id: string) => void;







  openDrawer: (kind: AppState["drawer"], payload?: { agentId?: string; runId?: string }) => void;



  closeDrawer: () => void;



  pushToast: (toast: Omit<Toast, "id">) => void;



  resetWorkspace: () => void;



}







const AppContext = createContext<AppState | null>(null);







const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;







export function AppProvider({ children }: { children: ReactNode }) {



  const initial = useRef(storage.load());



  const [ready, setReady] = useState(false);



  const [page, setPage] = useState<PageId>("command-center");







  const [settings, setSettings] = useState<Settings>(initial.current.settings);



  const [agents, setAgents] = useState<Agent[]>(initial.current.agents);



  const [messages, setMessages] = useState<ChatMessage[]>(initial.current.messages);



  const [runs, setRuns] = useState<Run[]>(initial.current.runs);



  const [activity, setActivity] = useState<ActivityItem[]>(initial.current.activity);



  const [docs, setDocs] = useState<KnowledgeDoc[]>(initial.current.docs);



  const [memory, setMemory] = useState<MemoryEntry[]>(initial.current.memory);







  const [catalog, setCatalog] = useState<CatalogModel[]>([]);



  const [catalogLoading, setCatalogLoading] = useState(false);



  const [catalogError, setCatalogError] = useState("");



  const [sync, setSync] = useState<SyncState>(initial.current.sync ?? emptySync());



  const [openrouter, setOpenrouter] = useState<Connection>(idle);



  const [ollama, setOllama] = useState<Connection>(idle);



  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);







  const [streamingAgentId, setStreamingAgentId] = useState<string | null>(null);



  const [toasts, setToasts] = useState<Toast[]>([]);



  const [upgradeOpen, setUpgradeOpen] = useState(false);



  const [drawer, setDrawer] = useState<AppState["drawer"]>(null);



  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);



  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);



  const abortRef = useRef<AbortController | null>(null);







  // persistence



  useEffect(() => {



    storage.save({ settings, agents, messages, runs, activity, docs, memory, sync });



  }, [settings, agents, messages, runs, activity, docs, memory, sync]);







  const pushToast = useCallback((toast: Omit<Toast, "id">) => {



    const id = uid("toast");



    setToasts((prev) => [...prev, { ...toast, id }]);



    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);



  }, []);







  const logActivity = useCallback((agentId: string, message: string, tone: ActivityItem["tone"] = "info") => {



    setActivity((prev) => [{ id: uid("act"), agentId, message, ts: Date.now(), tone }, ...prev].slice(0, 200));



  }, []);







  const modelById = useCallback((id: string) => catalog.find((m) => m.id === id), [catalog]);







  const modelForAgent = useCallback(



    (agent: Agent) => agent.model || settings.defaultModel,



    [settings.defaultModel],



  );







  const refreshCatalog = useCallback(async () => {



    setCatalogLoading(true);



    setCatalogError("");



    let list: CatalogModel[] = [];



    let remoteOk = false;







    try {



      list = await provider.listOpenRouterModels();



      remoteOk = true;



    } catch (err) {



      const detail = err instanceof Error ? err.message : "Could not reach OpenRouter";



      setCatalogError(detail);



      setSync((prev) => ({ ...prev, lastAttemptAt: Date.now(), lastError: detail }));



    }







    try {



      const local = await provider.listOllamaModels(settings.ollamaUrl);



      list = [...list, ...local];



      setOllama({



        state: local.length ? "connected" : "error",



        detail: local.length ? `${local.length} local model${local.length === 1 ? "" : "s"}` : "No local models pulled",



        checkedAt: Date.now(),



      });



    } catch {



      setOllama({ state: "idle", detail: "Ollama not detected", checkedAt: Date.now() });



    }







    setCatalog(list);







    if (remoteOk) {



      const snapshot = toSnapshot(list);



      setSync((prev) => {



        const diff = diffCatalog(prev.snapshot, snapshot);



        const notable = diff.changes.filter(



          (c) => c.kind === "became_paid" || c.kind === "removed",



        );



        if (notable.length) {



          window.setTimeout(() => {



            pushToast({



              title: `${notable.length} free/listing change${notable.length === 1 ? "" : "s"}`,



              detail: notable[0].name,



              tone: "warn",



            });



          }, 0);



        }



        return {



          snapshot,



          lastDiff: diff.baseline && !prev.snapshot ? diff : diff,



          lastSyncedAt: snapshot.fetchedAt,



          lastAttemptAt: snapshot.fetchedAt,



          lastError: "",



          source: prev.source,



        };



      });



    }







    setCatalogLoading(false);



  }, [pushToast, settings.ollamaUrl]);







  const testOpenRouter = useCallback(



    async (key?: string) => {



      const apiKey = (key ?? settings.apiKey).trim();



      if (!apiKey) {



        setOpenrouter({ state: "idle", detail: "No API key", checkedAt: null });



        setKeyInfo(null);



        return false;



      }



      setOpenrouter({ state: "checking", detail: "Verifying key…", checkedAt: null });



      try {



        const info = await provider.verifyOpenRouterKey(apiKey);



        setKeyInfo(info);



        const remaining =



          info.limitRemaining !== null



            ? `$${info.limitRemaining.toFixed(2)} remaining`



            : info.limit === null



              ? "no key limit"



              : `$${info.limit.toFixed(2)} limit`;



        setOpenrouter({



          state: "connected",



          detail: `${info.label} · ${remaining}`,



          checkedAt: Date.now(),



        });



        return true;



      } catch (err) {



        setKeyInfo(null);



        setOpenrouter({



          state: "error",



          detail: err instanceof Error ? err.message : "Key verification failed",



          checkedAt: Date.now(),



        });



        return false;



      }



    },



    [settings.apiKey],



  );







  const testOllama = useCallback(async () => {



    setOllama({ state: "checking", detail: "Probing local runtime…", checkedAt: null });



    try {



      const local = await provider.listOllamaModels(settings.ollamaUrl);



      setCatalog((prev) => [...prev.filter((m) => m.source !== "ollama"), ...local]);



      setOllama({



        state: local.length ? "connected" : "error",



        detail: local.length ? `${local.length} local model${local.length === 1 ? "" : "s"}` : "Reachable, no models pulled",



        checkedAt: Date.now(),



      });



      return local.length > 0;



    } catch (err) {



      setOllama({



        state: "error",



        detail: err instanceof Error ? err.message : "Ollama unreachable",



        checkedAt: Date.now(),



      });



      return false;



    }



  }, [settings.ollamaUrl]);







  // boot



  useEffect(() => {



    void (async () => {



      await refreshCatalog();



      if (initial.current.settings.apiKey) await testOpenRouter(initial.current.settings.apiKey);



      setReady(true);



    })();



    // eslint-disable-next-line react-hooks/exhaustive-deps



  }, []);







  // Daily catalog sync: ticks every 10 minutes, refetches when older than the



  // configured interval, and also re-checks whenever the tab regains focus.



  useEffect(() => {



    if (!ready || !settings.autoSyncModels) return;







    const maybeSync = () => {



      if (document.visibilityState === "hidden") return;



      if (isStale(sync.lastSyncedAt, settings.syncIntervalHours)) void refreshCatalog();



    };







    maybeSync();



    const timer = window.setInterval(maybeSync, 10 * 60 * 1000);



    window.addEventListener("focus", maybeSync);



    document.addEventListener("visibilitychange", maybeSync);



    return () => {



      window.clearInterval(timer);



      window.removeEventListener("focus", maybeSync);



      document.removeEventListener("visibilitychange", maybeSync);



    };



  }, [ready, settings.autoSyncModels, settings.syncIntervalHours, sync.lastSyncedAt, refreshCatalog]);







  const catalogStale = isStale(sync.lastSyncedAt, settings.syncIntervalHours);







  // Guards against a model that was delisted or lost its free tier overnight.



  const activeModelIssue = useMemo(() => {



    const id = settings.defaultModel;



    if (!id || catalog.length === 0) return "";



    const live = catalog.find((m) => m.id === id);



    if (!live) return `${id} is no longer listed on OpenRouter. Pick another model.`;



    const before = sync.snapshot?.models.find((m) => m.id === id);



    if (before?.free && !live.free) return `${live.name} is no longer free — requests will now be billed.`;



    return "";



  }, [settings.defaultModel, catalog, sync.snapshot]);







  const updateSettings = useCallback((patch: Partial<Settings>) => {



    setSettings((prev) => ({ ...prev, ...patch }));



  }, []);







  const buildContext = useCallback(



    (agent: Agent): string => {



      const parts: string[] = [agent.systemPrompt.trim()];



      const b = settings.business;



      const o = settings.operator;



      const address = [b.addressLine1, b.addressLine2, b.city, b.region, b.postalCode, b.country]



        .filter(Boolean)



        .join(", ");



      if (b.name || b.description) {



        parts.push(



          `# Business context\n${[



            b.name && `Name: ${b.name}`,



            b.legalName && b.legalName !== b.name && `Legal name: ${b.legalName}`,



            b.industry && `Industry: ${b.industry}`,



            b.size && `Headcount: ${b.size}`,



            b.website && `Website: ${b.website}`,



            b.email && `Email: ${b.email}`,



            b.phone && `Phone: ${b.phone}`,



            address && `Address: ${address}`,



            b.taxId && `Tax/registration ID: ${b.taxId}`,



            b.timezone && `Timezone: ${b.timezone}`,



            b.description && `Notes: ${b.description}`,



          ]



            .filter(Boolean)



            .join("\n")}`,



        );



      }



      if (o.name || o.email || o.phone) {



        parts.push(



          `# Primary contact\n${[



            o.name && `Name: ${o.name}`,



            o.role && `Role: ${o.role}`,



            o.email && `Email: ${o.email}`,



            o.phone && `Phone: ${o.phone}`,



          ]



            .filter(Boolean)



            .join("\n")}`,



        );



      }



      const notes = memory.filter((m) => m.agentId === agent.id || m.agentId === "all");



      if (notes.length) {



        parts.push(`# Standing memory\n${notes.map((m) => `- ${m.content}`).join("\n")}`);



      }



      const included = docs.filter((d) => d.includeInContext && d.text.trim());



      if (included.length) {



        const budget = 24000;



        const per = Math.max(1200, Math.floor(budget / included.length));



        parts.push(



          `# Attached documents\n${included



            .map((d) => `## ${d.name}\n${d.text.slice(0, per)}${d.text.length > per ? "\n…[truncated]" : ""}`)



            .join("\n\n")}`,



        );



      }



      const roster = agents.filter((a) => a.enabled && a.id !== agent.id);



      if (agent.kind === "super-agent" && roster.length) {



        parts.push(



          `# Specialist bots you can delegate to\n${roster.map((a) => `- ${a.name} (${a.role})`).join("\n")}`,



        );



      }



      return parts.filter(Boolean).join("\n\n");



    },



    [agents, docs, memory, settings.business, settings.operator],



  );







  const executeRun = useCallback(



    async (run: Run, agent: Agent, history: ChatMessage[]) => {



      const modelId = run.model;



      const model = catalog.find((m) => m.id === modelId);



      const assistantId = uid("msg");



      setStreamingAgentId(agent.id);



      setRuns((prev) => prev.map((r) => (r.id === run.id ? { ...r, status: "running" } : r)));



      setMessages((prev) => [



        ...prev,



        {



          id: assistantId,



          agentId: agent.id,



          role: "assistant",



          content: "",



          ts: Date.now(),



          model: modelId,



          pending: true,



        },



      ]);







      const turns: ChatTurn[] = [



        { role: "system", content: buildContext(agent) },



        ...history



          .filter((m) => m.agentId === agent.id && !m.error && m.content.trim())



          .slice(-16)



          .map((m) => ({ role: m.role, content: m.content })),



      ];







      const controller = new AbortController();



      abortRef.current = controller;







      try {



        // Use backend SSE when configured and a client is registered

        const useBackend = backendConfigured && settings.clientId;

        const result = useBackend

          ? await backend.streamChat({

              model,

              modelId,

              clientId: settings.clientId,

              apiKey: settings.apiKey,

              ollamaUrl: settings.ollamaUrl,

              messages: turns,

              signal: controller.signal,

              onDelta: (chunk) => {

                setMessages((prev) =>

                  prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),

                );

              },

            })

          : await provider.run({



          model,



          modelId,



          apiKey: settings.apiKey,



          ollamaUrl: settings.ollamaUrl,



          messages: turns,



          signal: controller.signal,



          onDelta: (chunk) => {



            setMessages((prev) =>



              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),



            );



          },



        });








        const cost = provider.cost(model, result.promptTokens, result.completionTokens);



        setMessages((prev) =>



          prev.map((m) =>



            m.id === assistantId



              ? {



                  ...m,



                  pending: false,



                  content: result.content || m.content,



                  model: result.model,



                  tokens: result.promptTokens + result.completionTokens,



                  cost,



                  latencyMs: result.latencyMs,



                }



              : m,



          ),



        );



        setRuns((prev) =>



          prev.map((r) =>



            r.id === run.id



              ? {



                  ...r,



                  status: "completed",



                  finishedAt: Date.now(),



                  promptTokens: result.promptTokens,



                  completionTokens: result.completionTokens,



                  cost,



                  latencyMs: result.latencyMs,



                  output: result.content,



                  model: result.model,



                }



              : r,



          ),



        );



        logActivity(agent.id, `completed “${run.title}”`, "ok");



      } catch (err) {



        const aborted = controller.signal.aborted;



        const detail = aborted ? "Stopped by operator" : err instanceof Error ? err.message : "Run failed";



        setMessages((prev) =>



          prev.map((m) =>



            m.id === assistantId



              ? { ...m, pending: false, error: !aborted, content: m.content || detail }



              : m,



          ),



        );



        setRuns((prev) =>



          prev.map((r) =>



            r.id === run.id



              ? { ...r, status: aborted ? "completed" : "failed", finishedAt: Date.now(), error: detail }



              : r,



          ),



        );



        logActivity(agent.id, `${aborted ? "stopped" : "failed"}: ${detail}`, aborted ? "info" : "warn");



        if (!aborted) pushToast({ title: "Run failed", detail, tone: "warn" });



      } finally {



        abortRef.current = null;



        setStreamingAgentId(null);



      }



    },



    [buildContext, catalog, logActivity, pushToast, settings.apiKey, settings.ollamaUrl],



  );







  /**



   * Accepts any file type. Text-bearing files are read in the browser and



   * become part of the agents' context; binaries are still recorded so the



   * backend can parse them later.



   */



  const addDocs = useCallback(



    async (files: File[], source = "upload"): Promise<Attachment[]> => {



      const added: Attachment[] = [];



      const binary: string[] = [];







      for (const file of files) {



        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";



        const looksTextual =



          /^(text\/|application\/(json|xml|x-yaml|yaml|javascript|typescript|sql|csv))/i.test(file.type) ||



          /^(txt|md|markdown|csv|tsv|json|ya?ml|log|html?|xml|ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|kt|c|h|cpp|cs|php|sh|bash|zsh|sql|ini|conf|env|toml|srt|vtt|rtf)$/i.test(



            ext,



          );







        let text = "";



        if (looksTextual) {



          try {



            const raw = await file.text();



            // Reject anything that decoded as binary noise.



            // eslint-disable-next-line no-control-regex



            if (!/\u0000/.test(raw.slice(0, 2000))) text = raw.slice(0, 40000);



          } catch {



            text = "";



          }



        }







        const readable = text.trim().length > 0;



        const doc: KnowledgeDoc = {



          id: uid("doc"),



          name: file.name,



          type: ext.toUpperCase() || "FILE",



          bytes: file.size,



          addedAt: Date.now(),



          chars: text.length,



          text,



          includeInContext: readable,



          source,



        };



        setDocs((prev) => [doc, ...prev]);



        added.push({ id: doc.id, name: doc.name, bytes: doc.bytes, type: doc.type, readable });



        if (!readable) binary.push(file.name);



        // Fire-and-forget: upload to backend for FTS indexing when available

        if (backendConfigured && settings.clientId) {

          void uploadDocumentToBackend(settings.clientId, file).catch(() => {});

        }



      }







      if (binary.length) {



        pushToast({



          title: binary.length === 1 ? "Stored without text" : `${binary.length} files stored without text`,



          detail: `${binary[0]}${binary.length > 1 ? " and others" : ""} need backend parsing`,



          tone: "warn",



        });



      }



      return added;



    },



    [pushToast, settings.clientId],



  );







  const sendMessage = useCallback(



    async (agentId: string, text: string, opts?: { requireApproval?: boolean; files?: File[] }) => {



      const prompt = text.trim();



      const files = opts?.files ?? [];



      if (!prompt && files.length === 0) return;



      const agent = agents.find((a) => a.id === agentId);



      if (!agent) return;



      const modelId = modelForAgent(agent);



      if (!modelId) {



        pushToast({ title: "No model selected", detail: "Pick a model in Settings or the Model Router", tone: "warn" });



        setPage("settings");



        return;



      }







      // Files are ingested into Knowledge first so their text is already part



      // of the agent's context by the time the turn is built.



      const attachments = files.length ? await addDocs(files, agentId) : [];



      const readableNames = attachments.filter((a) => a.readable).map((a) => a.name);



      const binaryNames = attachments.filter((a) => !a.readable).map((a) => a.name);







      let content = prompt;



      if (attachments.length) {



        const lines = [



          readableNames.length



            ? `Attached files (full text is in the Attached documents section): ${readableNames.join(", ")}`



            : "",



          binaryNames.length



            ? `Attached files that could not be read as text in the browser: ${binaryNames.join(", ")}`



            : "",



        ].filter(Boolean);



        content = [prompt || "Please review the attached files.", ...lines].join("\n\n");



      }







      const userMessage: ChatMessage = {



        id: uid("msg"),



        agentId,



        role: "user",



        content,



        attachments: attachments.length ? attachments : undefined,



        ts: Date.now(),



      };



      const nextHistory = [...messages, userMessage];



      setMessages(nextHistory);







      const runTitle =



        prompt.trim() ||



        (attachments.length



          ? `Review ${attachments.length} file${attachments.length === 1 ? "" : "s"}`



          : "Untitled mission");



      const run: Run = {



        id: uid("run"),



        title: runTitle.length > 70 ? `${runTitle.slice(0, 70)}…` : runTitle,



        prompt: content,



        agentId,



        model: modelId,



        status: opts?.requireApproval ? "pending_approval" : "running",



        createdAt: Date.now(),



        finishedAt: null,



        promptTokens: 0,



        completionTokens: 0,



        cost: 0,



        latencyMs: 0,



        output: "",



        error: "",



        requiresApproval: Boolean(opts?.requireApproval),



      };



      setRuns((prev) => [run, ...prev]);







      if (opts?.requireApproval) {



        logActivity(agentId, `queued “${run.title}” for approval`, "warn");



        pushToast({ title: "Waiting for approval", detail: run.title, tone: "warn" });



        return;



      }







      logActivity(agentId, `started “${run.title}”`, "info");



      await executeRun(run, agent, nextHistory);



    },



    [addDocs, agents, executeRun, logActivity, messages, modelForAgent, pushToast],



  );







  const approveRun = useCallback(



    async (runId: string) => {



      const run = runs.find((r) => r.id === runId);



      if (!run) return;



      const agent = agents.find((a) => a.id === run.agentId);



      if (!agent) return;



      logActivity(agent.id, `approved “${run.title}”`, "ok");



      await executeRun(run, agent, messages);



    },



    [agents, executeRun, logActivity, messages, runs],



  );







  const rejectRun = useCallback(



    (runId: string) => {



      setRuns((prev) =>



        prev.map((r) => (r.id === runId ? { ...r, status: "rejected", finishedAt: Date.now() } : r)),



      );



      const run = runs.find((r) => r.id === runId);



      if (run) logActivity(run.agentId, `rejected “${run.title}”`, "warn");



    },



    [logActivity, runs],



  );







  const stopStream = useCallback(() => abortRef.current?.abort(), []);







  const clearConversation = useCallback((agentId: string) => {



    setMessages((prev) => prev.filter((m) => m.agentId !== agentId));



  }, []);







  const createBot = useCallback(



    (input: { name: string; role: string; systemPrompt: string; model: string }) => {



      // Entitlement guard — specialist bots are a paid capability.



      const limit = PLAN_LIMITS[settings.plan].specialistBots;



      if (agents.filter((a) => a.kind === "specialist").length >= limit) {



        setUpgradeOpen(true);



        pushToast({ title: "Upgrade required", detail: "Specialist bots are part of Pro", tone: "warn" });



        return;



      }



      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || uid("bot");



      const bot: Agent = {



        id: slug,



        name: input.name.toUpperCase(),



        role: input.role,



        kind: "specialist",



        icon: "bot",



        enabled: true,



        model: input.model,



        systemPrompt:



          input.systemPrompt.trim() ||



          `You are ${input.name.toUpperCase()}, a ${input.role} specialist inside MERQATO Agent OS. Be precise and concise.`,



        tools: ["knowledge", "memory"],



        createdAt: Date.now(),



      };



      setAgents((prev) => (prev.some((a) => a.id === slug) ? prev : [...prev, bot]));



      logActivity(bot.id, "bot created", "ok");



      pushToast({ title: `${bot.name} created`, tone: "ok" });



    },



    [agents, settings.plan, logActivity, pushToast],



  );







  const updateAgent = useCallback((id: string, patch: Partial<Agent>) => {



    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));



  }, []);







  const deleteAgent = useCallback((id: string) => {



    setAgents((prev) => prev.filter((a) => a.id !== id || a.kind === "super-agent"));



    setMessages((prev) => prev.filter((m) => m.agentId !== id));



  }, []);







  const removeDoc = useCallback((id: string) => setDocs((prev) => prev.filter((d) => d.id !== id)), []);



  const toggleDoc = useCallback(



    (id: string) =>



      setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, includeInContext: !d.includeInContext } : d))),



    [],



  );







  const addMemory = useCallback((content: string, agentId: string) => {



    if (!content.trim()) return;



    setMemory((prev) => [



      { id: uid("mem"), content: content.trim(), agentId, createdAt: Date.now(), pinned: true },



      ...prev,



    ]);



  }, []);







  const removeMemory = useCallback((id: string) => setMemory((prev) => prev.filter((m) => m.id !== id)), []);







  const openDrawer = useCallback((kind: AppState["drawer"], payload?: { agentId?: string; runId?: string }) => {



    setDrawer(kind);



    if (payload?.agentId) setSelectedAgentId(payload.agentId);



    if (payload?.runId) setSelectedRunId(payload.runId);



  }, []);



  const closeDrawer = useCallback(() => setDrawer(null), []);







  const resetWorkspace = useCallback(() => {



    const fresh = emptyState();



    storage.clear();



    setSettings({ ...defaultSettings });



    setAgents([createSuperAgent()]);



    setMessages([]);



    setRuns([]);



    setActivity([]);



    setDocs([]);



    setMemory([]);



    setKeyInfo(null);



    setOpenrouter(idle);



    void fresh;



  }, []);







  const freeModels = useMemo(() => catalog.filter((m) => m.free), [catalog]);



  const paidModels = useMemo(() => catalog.filter((m) => !m.free), [catalog]);







  // Hermes is only "online" when it can actually answer: a model is selected and



  // that model's provider is reachable (verified key, or a live Ollama runtime).



  const { hermesReady, readyDetail } = useMemo(() => {



    const hermes = agents.find((a) => a.kind === "super-agent");



    if (!hermes?.enabled) return { hermesReady: false, readyDetail: "Super Agent disabled" };



    const id = hermes.model || settings.defaultModel;



    if (!id) return { hermesReady: false, readyDetail: "No model selected" };



    const model = catalog.find((m) => m.id === id);



    if (model?.source === "ollama" || id.startsWith("ollama/")) {



      return ollama.state === "connected"



        ? { hermesReady: true, readyDetail: "Local model ready" }



        : { hermesReady: false, readyDetail: "Ollama not connected" };



    }



    if (!settings.apiKey) return { hermesReady: false, readyDetail: "No API key" };



    if (openrouter.state === "error") return { hermesReady: false, readyDetail: "API key invalid" };



    if (openrouter.state !== "connected") return { hermesReady: false, readyDetail: "Not connected" };



    if (activeModelIssue) return { hermesReady: false, readyDetail: "Model unavailable" };



    return { hermesReady: true, readyDetail: "Ready" };



  }, [agents, settings.defaultModel, settings.apiKey, catalog, ollama.state, openrouter.state, activeModelIssue]);







  const specialistCount = agents.filter((a) => a.kind === "specialist").length;



  const botAllowance = PLAN_LIMITS[settings.plan].specialistBots;



  const canAddBot = specialistCount < botAllowance;







  const upgradePlan = useCallback(() => {



    setSettings((prev) => ({ ...prev, plan: "pro" }));



    setUpgradeOpen(false);



    pushToast({ title: "Pro unlocked", detail: "Specialist bots are now available", tone: "ok" });



  }, [pushToast]);







  const downgradePlan = useCallback(() => {



    setSettings((prev) => ({ ...prev, plan: "free" }));



    setAgents((prev) => prev.map((a) => (a.kind === "specialist" ? { ...a, enabled: false } : a)));



    pushToast({ title: "Switched to Starter", detail: "Specialist bots disabled", tone: "warn" });



  }, [pushToast]);







  const value = useMemo<AppState>(



    () => ({



      ready,



      page,



      setPage,



      settings,



      updateSettings,



      agents,



      messages,



      runs,



      activity,



      docs,



      memory,



      catalog,



      catalogLoading,



      catalogError,



      sync,



      catalogStale,



      activeModelIssue,



      openrouter,



      ollama,



      keyInfo,



      streamingAgentId,



      toasts,



      drawer,



      selectedAgentId,



      selectedRunId,



      hermesReady,



      readyDetail,



      canAddBot,



      botAllowance,



      specialistCount,



      upgradeOpen,



      setUpgradeOpen,



      upgradePlan,



      downgradePlan,



      modelById,



      modelForAgent,



      freeModels,



      paidModels,



      refreshCatalog,



      testOpenRouter,



      testOllama,



      sendMessage,



      stopStream,



      approveRun,



      rejectRun,



      clearConversation,



      createBot,



      updateAgent,



      deleteAgent,



      addDocs,



      removeDoc,



      toggleDoc,



      addMemory,



      removeMemory,



      openDrawer,



      closeDrawer,



      pushToast,



      resetWorkspace,



    }),



    [



      ready, page, settings, updateSettings, agents, messages, runs, activity, docs, memory,



      catalog, catalogLoading, catalogError, sync, catalogStale, activeModelIssue,



      hermesReady, readyDetail, canAddBot, botAllowance, specialistCount, upgradeOpen,



      upgradePlan, downgradePlan,



      openrouter, ollama, keyInfo, streamingAgentId,



      toasts, drawer, selectedAgentId, selectedRunId, modelById, modelForAgent, freeModels,



      paidModels, refreshCatalog, testOpenRouter, testOllama, sendMessage, stopStream,



      approveRun, rejectRun, clearConversation, createBot, updateAgent, deleteAgent, addDocs,



      removeDoc, toggleDoc, addMemory, removeMemory, openDrawer, closeDrawer, pushToast,



      resetWorkspace,



    ],



  );







  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;



}







export function useApp() {



  const ctx = useContext(AppContext);



  if (!ctx) throw new Error("useApp must be used within AppProvider");



  return ctx;



}







/** Metrics derived from real runs only. */



export function useMetrics() {



  const { runs } = useApp();



  return useMemo(() => {



    const done = runs.filter((r) => r.status === "completed" || r.status === "failed");



    const ok = runs.filter((r) => r.status === "completed");



    const failed = runs.filter((r) => r.status === "failed");



    const startOfDay = new Date().setHours(0, 0, 0, 0);



    const today = runs.filter((r) => r.createdAt >= startOfDay);



    const tokens = runs.reduce((sum, r) => sum + r.promptTokens + r.completionTokens, 0);



    const cost = runs.reduce((sum, r) => sum + r.cost, 0);



    const costToday = today.reduce((sum, r) => sum + r.cost, 0);



    const latencies = ok.filter((r) => r.latencyMs > 0).map((r) => r.latencyMs);



    const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;



    const successRate = done.length ? (ok.length / done.length) * 100 : null;



    return {



      hasData: runs.length > 0,



      totalRuns: runs.length,



      completed: ok.length,



      failed: failed.length,



      completedToday: today.filter((r) => r.status === "completed").length,



      tokens,



      cost,



      costToday,



      avgLatency,



      successRate,



      latencySeries: ok.slice(0, 24).map((r) => r.latencyMs).reverse(),



      costSeries: runs.slice(0, 24).map((r) => r.cost).reverse(),



      tokenSeries: runs.slice(0, 24).map((r) => r.promptTokens + r.completionTokens).reverse(),



    };



  }, [runs]);



}
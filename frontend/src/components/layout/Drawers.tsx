import { useEffect, useState } from "react";
import { AgentAvatar } from "../icons/AgentMark";
import { ModelPicker } from "../models/ModelPicker";
import { RunStatusIcon, statusMeta } from "../dashboard/LiveOperations";
import {
  Drawer,
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  TextArea,
  TextInput,
  Toggle,
} from "../ui/Primitives";
import { useApp } from "../../store/AppContext";
import { money, relTime, seconds } from "../../utils/format";

export function Drawers() {
  const {
    drawer,
    closeDrawer,
    selectedAgentId,
    selectedRunId,
    agents,
    runs,
    updateAgent,
    deleteAgent,
    createBot,
    approveRun,
    rejectRun,
    setPage,
    modelById,
    settings,
  } = useApp();

  const agent = agents.find((a) => a.id === selectedAgentId);
  const run = runs.find((r) => r.id === selectedRunId);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState("");

  useEffect(() => {
    if (agent) setAgentPrompt(agent.systemPrompt);
  }, [agent]);

  const chosen = modelById(model);
  const agentModel = agent ? modelById(agent.model || settings.defaultModel) : undefined;

  return (
    <>
      <Drawer open={drawer === "agent" && Boolean(agent)} title="BOT CONFIG" onClose={closeDrawer} width={460}>
        {agent && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AgentAvatar icon={agent.icon} size={46} active={agent.enabled} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl tracking-[0.14em] text-white">{agent.name}</div>
                <div className="text-sm text-muted">{agent.role}</div>
              </div>
              <Toggle checked={agent.enabled} onChange={(v) => updateAgent(agent.id, { enabled: v })} />
            </div>

            <Field label="Model override">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full rounded-lg border border-cyan/15 bg-[#071018] px-3 py-2 text-left text-sm hover:border-cyan/35"
              >
                {agentModel ? agentModel.name : "Use workspace default"}
              </button>
            </Field>

            <Field label="System prompt">
              <TextArea rows={8} value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <PrimaryButton className="flex-1" onClick={() => updateAgent(agent.id, { systemPrompt: agentPrompt })}>
                Save prompt
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  setPage(agent.kind === "super-agent" ? "super-agent" : "bots");
                  closeDrawer();
                }}
              >
                Open console
              </GhostButton>
            </div>

            {agent.kind === "specialist" && (
              <GhostButton
                className="w-full border-danger/30 text-danger hover:border-danger/50"
                onClick={() => {
                  deleteAgent(agent.id);
                  closeDrawer();
                }}
              >
                Delete bot
              </GhostButton>
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={drawer === "run" && Boolean(run)} title="RUN DETAIL" onClose={closeDrawer} width={480}>
        {run && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RunStatusIcon status={run.status} />
              <span className={statusMeta[run.status].className}>{statusMeta[run.status].label}</span>
              <span className="ml-auto text-xs text-muted">{relTime(run.createdAt)}</span>
            </div>
            <h4 className="text-base text-white">{run.title}</h4>

            <div className="grid grid-cols-2 gap-2">
              <Meta label="Model" value={run.model || "—"} />
              <Meta label="Latency" value={run.latencyMs ? seconds(run.latencyMs) : "—"} />
              <Meta label="Tokens" value={String(run.promptTokens + run.completionTokens || "—")} />
              <Meta label="Cost" value={run.cost ? money(run.cost, 4) : "—"} />
            </div>

            <div>
              <div className="mb-1 text-[10px] tracking-[0.16em] text-muted">PROMPT</div>
              <div className="whitespace-pre-wrap rounded-lg border border-cyan/10 bg-[#071018] p-3 text-sm text-white/85">
                {run.prompt}
              </div>
            </div>

            {run.output && (
              <div>
                <div className="mb-1 text-[10px] tracking-[0.16em] text-muted">OUTPUT</div>
                <div className="scroll-thin max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-cyan/10 bg-[#071018] p-3 text-sm text-white/85">
                  {run.output}
                </div>
              </div>
            )}

            {run.error && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{run.error}</div>
            )}

            {run.status === "pending_approval" && (
              <div className="flex gap-2">
                <GhostButton
                  className="flex-1"
                  onClick={() => {
                    rejectRun(run.id);
                    closeDrawer();
                  }}
                >
                  Reject
                </GhostButton>
                <PrimaryButton
                  className="flex-1"
                  onClick={() => {
                    void approveRun(run.id);
                    closeDrawer();
                  }}
                >
                  Approve & run
                </PrimaryButton>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={drawer === "bot-create"} title="NEW SPECIALIST" onClose={closeDrawer} width={440}>
        <div className="space-y-4">
          <Field label="Name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="ATLAS" />
          </Field>
          <Field label="Role">
            <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Finance" />
          </Field>
          <Field label="Model">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="w-full rounded-lg border border-cyan/15 bg-[#071018] px-3 py-2 text-left text-sm hover:border-cyan/35"
            >
              {chosen ? chosen.name : "Use workspace default"}
            </button>
          </Field>
          <Field label="System prompt">
            <TextArea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what this bot owns and how it should answer."
            />
          </Field>
          <PrimaryButton
            className="w-full"
            disabled={!name.trim() || !role.trim()}
            onClick={() => {
              createBot({ name, role, systemPrompt: prompt, model });
              setName("");
              setRole("");
              setPrompt("");
              setModel("");
              closeDrawer();
            }}
          >
            Create bot
          </PrimaryButton>
        </div>
      </Drawer>

      <Modal open={pickerOpen} title="SELECT MODEL" onClose={() => setPickerOpen(false)} wide>
        <ModelPicker
          value={drawer === "agent" && agent ? agent.model : model}
          onChange={(id) => {
            if (drawer === "agent" && agent) updateAgent(agent.id, { model: id });
            else setModel(id);
            setPickerOpen(false);
          }}
          height={420}
        />
      </Modal>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan/10 px-3 py-2">
      <div className="text-[10px] tracking-[0.16em] text-muted">{label}</div>
      <div className="truncate text-sm text-white">{value}</div>
    </div>
  );
}

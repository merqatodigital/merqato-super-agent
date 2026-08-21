# MERQATO Super Agent

A Hermes Agent profile distribution that packages a branded, plan-enforceable Super Agent for customers.

Built on [Hermes Agent](https://github.com/NousResearch/hermes-agent) (MIT, Copyright (c) 2025 Nous Research).

## What it is

A distributable Hermes profile — personality (SOUL.md), skills, configuration, cron jobs, and MCP connections — that customers install with:

```bash
hermes profile install github.com/merqatodigital/merqato-super-agent
```

## Repository structure

```
distributions/super-agent/
├── distribution.yaml    # Hermes profile distribution manifest
├── SOUL.md              # Agent personality / system instructions
├── config.yaml          # Model, temperature, tool defaults, plan enforcement
└── skills/              # MERQATO-authored skills (business operator, research, etc.)
```

## Plans

| Plan       | Execution        | Model strategy              |
| ---------- | ---------------- | --------------------------- |
| Local      | One Super Agent  | Ollama / local model        |
| BYOK       | One Super Agent  | Customer's OpenRouter key   |
| Cloud      | One Super Agent  | Models supplied by MERQATO  |
| Bot Team   | Specialist bots  | Workers + coordinator       |
| Enterprise | Bot fleets       | Per-bot routing, A2A       |

Plan enforcement is configured in `config.yaml` and optionally mediated by a MERQATO control layer.

## Upstream

This distribution reuses Hermes Agent runtime primitives — profiles, Bot Mode, profile distributions, tools, skills, memory, cron, delegation — without modifying the Hermes core.

See upstream: https://github.com/NousResearch/hermes-agent

## License

MERQATO-authored files in this repository are Copyright (c) 2026 MerQato Digital and licensed under the MIT License. See `LICENSE` and `THIRD_PARTY_NOTICES` for upstream attribution.

Upstream Hermes Agent is MIT-licensed: Copyright (c) 2025 Nous Research.

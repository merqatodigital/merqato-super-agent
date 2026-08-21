# MERQATO Super Agent — Architecture

## Overview

MERQATO Super Agent is delivered as a Hermes Agent profile distribution with a supporting web dashboard and backend. The product is composed of four responsibility domains, each owned by a specific team.

## Team responsibilities

### Arena: frontend

**Owner:** `frontend/`

Arena builds the MERQATO Command Center — a responsive web dashboard. The dashboard is optimized for **laptop and desktop** as the primary experience. It must render uniformly on **tablets** using the same responsive layout, and provide **lightweight mobile support** for status and approvals.

- Primary screens: desktop and laptop.
- Tablet: same dashboard, responsive layout.
- Mobile: lightweight status + approvals only.

### DeepSeek: backend

**Owner:** `backend/`

DeepSeek builds the FastAPI backend. Responsibilities:

- Customer onboarding (`/api/clients`)
- Business documents (`/api/clients/{id}/documents`)
- Searchable knowledge (`/api/clients/{id}/knowledge/search`)
- Settings (`/api/clients/{id}/settings`)
- Bot registry (`/api/bots`)
- Task tracking (`/api/tasks`)
- Approval queue (`/api/approvals`)
- Health and Hermes status endpoints

Default storage:

- **SQLite** for structured data.
- **Local file storage** for documents and knowledge artifacts.

Hosted Supabase is **not required** for v1.

### Hermes: agent runtime

**Owner:** `distributions/`

Hermes owns the agent runtime. MERQATO Super Agent ships as a Hermes profile distribution containing:

- `distribution.yaml` — manifest
- `SOUL.md` — agent persona
- `config.yaml` — model, tools, skills, plan enforcement
- Skills authored or referenced by MERQATO

Hermes provides the native tools (file, terminal, browser, web, delegation, cron, memory, skills, MCP, session search), Bot Mode, profile distributions, and OpenRouter/Ollama configuration. Telegram integration is a Hermes gateway capability that provides the **primary mobile conversation channel**.

### Shared integration contract

**Owner:** `shared/openapi.yaml`

`shared/openapi.yaml` is the frontend/backend integration contract. Arena and DeepSeek both consume it. Hermes integration endpoints are marked **preliminary** until the runtime interface is verified against the live Hermes distribution.

## Device strategy

| Surface | Role |
|---------|------|
| Desktop / laptop | Primary Command Center experience |
| Tablet | Same responsive dashboard |
| Mobile web | Lightweight status and approvals |
| Telegram | Primary mobile conversation channel |

The mobile website is intentionally minimal. Full interaction flows (chat, delegation, routines, approvals that require context) target desktop, laptop, tablet, and Telegram.

## Data and hosting

- **SQLite** is the default database backend.
- **Local file storage** is the default document and knowledge store.
- No hosted Supabase dependency is introduced for v1.
- Backend is designed to run locally or in a lightweight hosted environment.

## Hermes as the runtime

Hermes remains the agent runtime throughout. The backend integrates with Hermes through:

- Hermes profile distribution installation and configuration.
- Hermes tools and Bot Mode where the backend needs to dispatch work.
- Hermes memory and session storage for agent state.

The backend does not replace Hermes. It supplies customer data, documents, knowledge, settings, and operational state that the Hermes agent can reference through its tools and skills.

## Boundaries

- `frontend/` is Arena only. No backend logic here.
- `backend/` is DeepSeek only. No frontend UI here.
- `distributions/` is Hermes only. No application server code here.
- `shared/openapi.yaml` is the contract between frontend and backend. It is not a runtime implementation.
- `docs/` is documentation.
- No additional orchestrator framework is introduced.

## Preserved distribution files

The following files are preserved unchanged from the initial foundation:

- `distributions/super-agent/distribution.yaml`
- `distributions/super-agent/SOUL.md`
- `distributions/super-agent/config.yaml`

These files remain owned by Hermes and are part of the profile distribution payload, not the application backend.

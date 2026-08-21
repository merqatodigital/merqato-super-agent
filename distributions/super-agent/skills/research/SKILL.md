---
name: research
description: "Research a customer's business, competitors, suppliers, market, and industry using Hermes web-search, browser, extraction, and memory. Prioritize primary and reliable sources, record source URLs and publication dates, separate verified facts from assumptions and unanswered questions, respect the customer's uploaded business knowledge, isolate research per customer, avoid unnecessary token-heavy delegation, and request approval before contacting people, submitting forms, or purchasing services."
version: 1.0.0
author: MerQato Digital
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Research, Competitive-Intelligence, Market-Analysis, Customer-Data, Approval]
    related_skills: [business-operator]
---

# Research

## Purpose

This skill teaches the MERQATO Super Agent how to conduct research on behalf of a customer while staying accurate, sourced, and disciplined about cost and customer isolation.

Use this skill when a customer asks you to:
- Investigate their business landscape
- Analyze competitors
- Find suppliers or vendors
- Understand a market or industry
- Gather background information before an operational decision

## Core principles

### 1. Start from the customer's business knowledge

Before you begin any external research, read the customer's uploaded business knowledge. Their materials may already answer part of the question or define the scope you should work within.

- Use the customer's documents and knowledge entries as the baseline.
- Note where their materials are silent — that is often where research is needed.
- Do not override what the customer has explicitly stated without a strong, sourced reason.

### 2. Define the research question clearly

Before you search, restate the research goal in concrete terms:
- What decision will this research inform?
- What specific facts are needed?
- What would count as a sufficient answer?
- What is out of scope?

If the request is vague, ask for the missing scope rather than guessing at a broad research sweep.

### 3. Prioritize primary and reliable sources

When you gather information:
- Prefer primary sources: official sites, filings, direct statements, published data, firsthand accounts.
- Prefer established secondary sources with clear authorship and dates over anonymous posts.
- Treat marketing pages, aggregators, and AI-generated summaries as lower-confidence unless corroborated.
- Never cite a source you have not actually inspected.

If a claim matters, try to find at least two independent sources before treating it as confirmed.

### 4. Record source URLs and relevant dates

For every external fact you use:
- Save the source URL.
- Note the publication or access date if it is available and relevant.
- Note what the source actually says, not just the headline.

When you report findings, include enough citation detail that the customer can verify the source themselves.

### 5. Separate verified facts, assumptions, and unanswered questions

Label everything you learn:

- **Verified fact** — confirmed by at least one inspected primary or reliable source.
- **Corroborated** — supported by more than one independent source.
- **Assumption** — inferred but not confirmed by the sources you inspected.
- **Unanswered** — explicitly noted as not yet resolved.

Do not present assumptions as facts. Do not leave the customer with the impression that an unanswered question is resolved.

### 6. Use Hermes native tools rather than token-heavy delegation

Use Hermes's built-in capabilities first:
- Web search to find candidate sources
- Browser and web extraction to read and capture source content
- File tools to save and organize research notes
- Memory to preserve context within the session

Avoid launching unnecessary delegations or activating Bots for routine research. Keep the research path simple and inspectable. If a task genuinely requires a specialist tool or skill, use it only when it is actually available to the profile.

### 7. Do not mix research between customers

Each customer's research stays with that customer:
- Do not carry a competitor list, market note, or source from one customer into another.
- If you research multiple customers in the same session, keep each set of findings clearly separated and labeled by customer.
- Never use one customer's business information as the basis for another customer's research.

### 8. Respect the customer's uploaded business knowledge

If the customer's materials conflict with external sources:
- Surface the conflict explicitly.
- Prefer the customer's explicit statements for their own business.
- Treat external sources as supplementary unless the customer says otherwise.

Do not silently replace the customer's stated facts with outside information.

### 9. Request approval before external actions

Before taking any of the following, stop and request explicit customer approval:
- Contacting a person, company, or representative
- Submitting any form or application
- Starting a trial, purchase, subscription, or paid service
- Sharing the customer's information with a third party
- Publishing or sending anything on the customer's behalf

Present what you propose, why, what it costs or risks, and what the customer needs to confirm.

### 10. Present concise findings with sources, actions, and blockers

When you finish, report:
- **Question addressed** — what you were asked to research
- **Key findings** — concise, labeled by verified fact, assumption, or unanswered
- **Sources** — URLs and dates for the material you relied on
- **Recommended actions** — what the customer might do next, clearly separated from confirmed facts
- **Blockers** — anything that remains unresolved or requires more information
- **Approvals needed** — any external actions still awaiting customer confirmation

Keep the report short enough to act on. Attach evidence where the customer needs to verify it.

## Operational boundaries

- You do not contact people, submit forms, or purchase services without approval.
- You do not mix customer research.
- You do not fabricate sources.
- You do not treat unverified claims as confirmed.
- You do not spend the customer's API budget unnecessarily.
- You do not execute financial decisions. Money-related conclusions are informational only.

## Using Hermes research-related skills

The MERQATO profile may have access to specialist research skills. If and when they are available to the active profile, use them for the parts of the task they fit best:

- `arxiv` — academic and preprint search
- `blogwatcher` — ongoing blog and feed monitoring
- `competitor-news-monitor` — competitor material changes
- `grounded-citations` — source-grounded citation work
- `lean-public-web-research` — public data and entity discovery
- `llm-wiki` — structured knowledge base queries
- `open-source-audit` — open-source and self-hostable evaluation
- `polymarket` — prediction market data where relevant
- `web-lead-research` — business and lead discovery

If none of these are available, rely on Hermes native tools:
- `web_search`
- `browser` / web browsing
- `web_extract`
- `memory`
- file tools for notes and evidence

Do not invent or assume the presence of any skill or tool. If a needed capability is missing, say so.

## Customer research isolation

- One customer at a time unless explicitly instructed otherwise.
- Label every finding with the customer it belongs to.
- Never reuse another customer's research as evidence for a new customer.
- If you are asked to compare customers, use only the information each customer has provided or explicitly authorized.

## Saving research outputs

When useful, save research notes as files so the customer has inspectable evidence:
- Source list with URLs and dates
- Findings organized by question
- Separate sections for verified facts, assumptions, and unanswered questions
- Recommended actions and required approvals

Clear notes are better than a long conversation history the customer cannot easily reuse.

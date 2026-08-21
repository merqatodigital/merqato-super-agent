# THIRD-PARTY NOTICES

## Hermes Agent

This MERQATO Super Agent distribution is built on Hermes Agent.

- **Project:** Hermes Agent
- **Repository:** https://github.com/NousResearch/hermes-agent
- **License:** MIT License
- **Copyright:** Copyright (c) 2025 Nous Research
- **Usage in this distribution:** Hermes Agent provides the runtime primitives — profiles, Bot Mode, profile distributions, tools, skills, memory, cron, delegation, browser, coding, and session search — reused by this distribution without modification to the Hermes core.

The full Hermes Agent license text is reproduced below:

```
MIT License

Copyright (c) 2025 Nous Research

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Upstream features reused

- **Profile Distributions:** Hermes packages a complete agent (personality, skills, cron, MCP, config) as a git repository installable with `hermes profile install`.
- **Bot Mode:** Hermes profiles can be turned into named Bots — each with its own role, model, memory, skills, and avatar; Bots run routines, share group chats, and message each other.
- **Tools:** Hermes provides built-in tools for file operations, terminal, browser, web search, web extraction, delegation, cron, memory, skills, MCP, and session search.
- **Skills:** Hermes supports a skills system where agents load curated capability modules.
- **Memory:** Hermes profiles have isolated memory and chat history under `~/.hermes/profiles/<name>/`.
- **OpenRouter / Ollama:** Hermes includes OpenRouter client and Ollama support for model routing.

These features are confirmed as present in Hermes Agent v0.20.4 (2026.8.18) and earlier releases.

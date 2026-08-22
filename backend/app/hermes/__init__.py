# MERQATO Super Agent — Backend Chat Bridge
# This module provides the FastAPI endpoint that bridges the frontend chat
# to the Hermes Agent runtime.
#
# Architecture:
#   Frontend (React) → FastAPI SSE endpoint → hermes chat subprocess → OpenRouter/Ollama
#
# Each customer gets their own Hermes profile directory. The backend manages
# profile creation, API key storage, and chat session execution.

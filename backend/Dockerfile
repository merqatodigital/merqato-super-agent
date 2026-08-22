# ---- Build context is the REPO ROOT, not backend/ ----
# Build with: docker build -f backend/Dockerfile .

FROM python:3.11-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl build-essential && \
    rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Install Hermes Agent (git clone + editable pip install)
# ---------------------------------------------------------------------------
RUN git clone --depth 1 https://github.com/NousResearch/hermes-agent.git /opt/hermes-agent

WORKDIR /opt/hermes-agent
RUN python -m venv /opt/hermes-venv && \
    /opt/hermes-venv/bin/pip install --upgrade pip && \
    /opt/hermes-venv/bin/pip install -e .

ENV PATH="/opt/hermes-venv/bin:${PATH}"
ENV HERMES_EXECUTABLE="/opt/hermes-venv/bin/hermes"
ENV HERMES_BASE="/data/hermes"
ENV HERMES_PROFILES_DIR="/data/hermes/profiles"

# ---------------------------------------------------------------------------
# Application (copy backend/ and distributions/)
# ---------------------------------------------------------------------------
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/
COPY distributions/super-agent /app/distributions/super-agent

RUN mkdir -p /data/hermes/profiles

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

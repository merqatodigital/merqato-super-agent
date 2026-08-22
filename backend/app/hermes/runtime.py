"""Hermes Agent Runtime Bridge.

Provides functions to execute chat queries against the Hermes Agent runtime
using a customer's profile configuration.
"""

import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any, Callable, Iterator


HERMES_CLI = os.environ.get(
    "HERMES_EXECUTABLE",
    shutil.which("hermes") or "hermes",
)
HERMES_BASE = Path(os.environ.get(
    "HERMES_BASE",
    str(Path.home() / ".local" / "hermes"),
))
HERMES_PROFILES_DIR = Path(os.environ.get(
    "HERMES_PROFILES_DIR",
    str(HERMES_BASE / "profiles"),
))


def get_profile_dir(profile_name: str) -> Path:
    """Get the Hermes profile directory for a customer profile."""
    return HERMES_PROFILES_DIR / profile_name


def ensure_profile_exists(
    profile_name: str,
    distribution_path: Path | None = None,
    api_key: str | None = None,
    model_provider: str = "openrouter",
    model_name: str = "anthropic/claude-sonnet-4",
) -> Path:
    """Ensure a Hermes profile exists for a customer. Creates it if needed."""
    profile_dir = get_profile_dir(profile_name)
    skills_dir = profile_dir / "skills"
    needs_install = not profile_dir.exists() or not skills_dir.exists() or not list(skills_dir.iterdir())

    # Install distribution if profile is fresh or skills are missing
    if needs_install and distribution_path and distribution_path.exists():
        result = subprocess.run(
            [str(HERMES_CLI), "profile", "install", str(distribution_path), "--name", profile_name, "--force", "-y"],
            capture_output=True,
            text=True,
            check=False,
            stdin=subprocess.DEVNULL,
        )
        if result.returncode != 0:
            import logging
            logging.warning("hermes profile install failed: %s", result.stderr)

    # If install didn't create it, create manually
    if not profile_dir.exists():
        profile_dir.mkdir(parents=True, exist_ok=True)
    
    # Store API key in profile .env if provided
    if api_key:
        env_path = profile_dir / ".env"
        env_path.write_text(f'OPENROUTER_API_KEY={api_key}\n')
        env_path.chmod(0o600)
    
    return profile_dir


def execute_chat(
    profile_name: str,
    message: str,
    system_prompt: str | None = None,
    model: str | None = None,
    attachments: list[str] | None = None,
) -> Iterator[str]:
    """Execute a chat query against the Hermes profile.
    
    Yields streaming response chunks.
    
    Raises:
        RuntimeError: If Hermes CLI is not available or profile doesn't exist.
    """
    profile_dir = get_profile_dir(profile_name)
    if not profile_dir.exists():
        raise RuntimeError(f"Profile '{profile_name}' does not exist")
    
    if not HERMES_CLI or not Path(HERMES_CLI).exists():
        raise RuntimeError(f"Hermes CLI not found at {HERMES_CLI}")
    
    # Build the command
    cmd = [HERMES_CLI, "chat", "-p", profile_name, "-q", message]
    
    if system_prompt:
        # Hermes doesn't directly support system prompt override via CLI
        # In production, this would be handled through profile configuration
        pass
    
    if model:
        cmd.extend(["-m", model])
    
    # Run Hermes chat and capture output
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        
        def read_stream(stream: Any, callback: Callable[[str], None]) -> None:
            try:
                for line in stream:
                    callback(line)
            except Exception:
                pass
        
        # Stream stdout to yield chunks
        for line in proc.stdout:
            yield line
        
        proc.wait(timeout=300)  # 5 minute timeout
        
        if proc.returncode != 0:
            stderr = proc.stderr.read() if proc.stderr else ""
            raise RuntimeError(f"Hermes chat failed: {stderr}")
        
    except subprocess.TimeoutExpired:
        proc.kill()
        raise RuntimeError("Hermes chat timed out after 5 minutes")
    except Exception as e:
        raise RuntimeError(f"Failed to execute Hermes chat: {e}")


def stream_chat(
    profile_name: str,
    messages: list[dict[str, str]],
    model: str | None = None,
) -> Iterator[str]:
    """Stream a chat conversation through Hermes.
    
    Args:
        profile_name: The Hermes profile name (customer identifier)
        messages: List of message dicts with 'role' and 'content' keys
        model: Optional model override
    
    Yields:
        Streaming text chunks from Hermes response
    """
    if not messages:
        return
    
    # Convert messages to the format Hermes expects
    # Hermes uses -q for single query, but for multi-turn we need
    # to pass the conversation context
    last_message = messages[-1]
    context = "\n".join(
        f"{m['role']}: {m['content']}" for m in messages[:-1]
    )
    
    full_query = f"{context}\n\n{last_message['role']}: {last_message['content']}" if context else last_message['content']
    
    yield from execute_chat(profile_name, full_query, model=model)


# Model status checking
def check_ollama_status(base_url: str) -> dict[str, Any]:
    """Check if Ollama is available and list models."""
    import requests
    
    try:
        resp = requests.get(f"{base_url}/api/tags", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            models = [
                {"name": m["name"], "size": m.get("size", 0)}
                for m in data.get("models", [])
            ]
            return {"available": True, "models": models}
    except Exception:
        pass
    
    return {"available": False, "models": []}


def check_openrouter_key(api_key: str) -> dict[str, Any]:
    """Validate an OpenRouter API key."""
    import requests
    
    try:
        resp = requests.get(
            "https://openrouter.ai/api/v1/key",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "valid": True,
                "label": data.get("data", {}).get("label", "OpenRouter Key"),
                "usage": data.get("data", {}).get("usage", 0),
                "limit": data.get("data", {}).get("limit"),
                "limit_remaining": data.get("data", {}).get("limit_remaining"),
            }
        elif resp.status_code == 401:
            return {"valid": False, "error": "Invalid API key"}
    except Exception as e:
        return {"valid": False, "error": str(e)}
    
    return {"valid": False, "error": "Unknown error"}


# Customer profile management
def create_customer_profile(
    client_id: str,
    customer_name: str,
    api_key: str | None = None,
    model_provider: str = "openrouter",
    model_name: str = "anthropic/claude-sonnet-4",
    storage_root: Path | None = None,
) -> Path:
    """Create a Hermes profile for a new customer.
    
    Args:
        client_id: Unique client identifier
        customer_name: Display name for the customer
        api_key: OpenRouter API key (stored securely)
        model_provider: 'openrouter' or 'ollama'
        model_name: Model identifier
        storage_root: Root storage directory
    
    Returns:
        Path to the created profile directory
    """
    profile_name = f"customer-{client_id}"
    
    # Resolve both the Docker layout (/app/distributions) and repository checkout.
    configured_distribution = os.environ.get("MERQATO_DISTRIBUTION_PATH")
    candidates = []
    if configured_distribution:
        candidates.append(Path(configured_distribution))
    runtime_path = Path(__file__).resolve()
    candidates.extend(
        parent / "distributions" / "super-agent"
        for parent in runtime_path.parents
    )
    dist_path = next((candidate for candidate in candidates if candidate.is_dir()), None)
    if dist_path is None:
        raise RuntimeError(
            "MERQATO Super Agent distribution not found; set MERQATO_DISTRIBUTION_PATH"
        )
    
    profile_dir = ensure_profile_exists(
        profile_name=profile_name,
        distribution_path=dist_path,
        api_key=api_key,
        model_provider=model_provider,
        model_name=model_name,
    )
    
    # Write customer metadata
    meta_path = profile_dir / "customer_meta.json"
    meta = {
        "client_id": client_id,
        "customer_name": customer_name,
        "model_provider": model_provider,
        "model_name": model_name,
        "created_at": time.time(),
    }
    meta_path.write_text(json.dumps(meta, indent=2))
    
    return profile_dir

import { FormEvent, useEffect, useState } from "react";
import { login, setupAccount, backendConfigured } from "../../services/backend";

interface Props {
  onAuthenticated?: () => void;
}

export function LoginPage({ onAuthenticated }: Props) {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!backendConfigured) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/setup/status`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setNeedsSetup(d.needs_setup))
      .catch(() => setNeedsSetup(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (needsSetup) {
        await setupAccount({ email, password, name: name || "Admin" });
      }
      await login({ email, password });
      onAuthenticated?.();
      // Reload to re-evaluate session state in App.tsx
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  if (needsSetup === null) {
    return (
      <div className="flex h-full items-center justify-center bg-void text-[11px] tracking-[0.32em] text-cyan">
        LOADING
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-void px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-cyan/20 bg-void/80 p-6 backdrop-blur"
      >
        <h1 className="text-center text-sm font-medium tracking-[0.2em] text-cyan">
          {needsSetup ? "CREATE ADMIN ACCOUNT" : "SIGN IN"}
        </h1>

        {needsSetup && (
          <input
            type="text"
            placeholder="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-cyan/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-cyan/50 focus:outline-none"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-cyan/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-cyan/50 focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-cyan/20 bg-transparent px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-cyan/50 focus:outline-none"
        />

        {error && (
          <p className="text-center text-[10px] text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded border border-cyan/40 bg-cyan/10 px-3 py-2 text-[11px] font-medium tracking-[0.15em] text-cyan transition hover:bg-cyan/20 disabled:opacity-40"
        >
          {loading ? "..." : needsSetup ? "CREATE ACCOUNT" : "SIGN IN"}
        </button>
      </form>
    </div>
  );
}

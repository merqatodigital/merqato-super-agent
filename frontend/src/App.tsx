import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./store/AppContext";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import { Shell } from "./components/layout/Shell";
import { LoginPage } from "./components/auth/LoginPage";
import { backendConfigured, checkSession } from "./services/backend";

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

function Root() {
  const { ready, settings } = useApp();

  // When a backend is configured, gate on session auth before rendering anything.
  const [authState, setAuthState] = useState<"loading" | "authed" | "unauthed" | "no-backend">(
    backendConfigured ? "loading" : "no-backend",
  );

  useEffect(() => {
    if (!backendConfigured) {
      setAuthState("no-backend");
      return;
    }
    let cancelled = false;
    checkSession().then((s) => {
      if (!cancelled) setAuthState(s ? "authed" : "unauthed");
    });
    return () => { cancelled = true; };
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-void px-6 text-center text-[11px] tracking-[0.32em] text-cyan">
        CHECKING SESSION
      </div>
    );
  }

  if (authState === "unauthed") {
    return <LoginPage />;
  }

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-void px-6 text-center text-[11px] tracking-[0.32em] text-cyan">
        SYNCHRONIZING HERMES
      </div>
    );
  }

  if (!settings.onboardingComplete) return <OnboardingWizard />;

  return <Shell />;
}

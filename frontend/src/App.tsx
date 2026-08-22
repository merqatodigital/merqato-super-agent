import { AppProvider, useApp } from "./store/AppContext";
import { OnboardingWizard } from "./components/onboarding/OnboardingWizard";
import { Shell } from "./components/layout/Shell";

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

function Root() {
  const { ready, settings } = useApp();

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-void px-6 text-center text-[11px] tracking-[0.32em] text-cyan">
        SYNCHRONIZING HERMES
      </div>
    );
  }

  if (!settings.onboardingComplete) return <OnboardingWizard />;

  // One interface at every breakpoint — the Shell adapts internally.
  return <Shell />;
}

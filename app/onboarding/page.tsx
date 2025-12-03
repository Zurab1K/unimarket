"use client";

import OnboardingSurvey from "@/components/OnboardingSurvey";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function OnboardingPage() {
  const ready = useAuthGuard({ requireOnboarding: false });
  if (!ready) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center px-4 py-16">
      <OnboardingSurvey />
    </main>
  );
}

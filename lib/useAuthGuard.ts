"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Options = {
  requireOnboarding?: boolean;
};

export function useAuthGuard(options: Options = { requireOnboarding: true }) {
  const { requireOnboarding = true } = options;
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      const skipAuth =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("skipAuth") === "true" ||
          localStorage.getItem("skipAuth") === "true");

      if (typeof window !== "undefined" && localStorage.getItem("skipAuth") === "true") {
        // Clear legacy skip flag so it doesn't persist across reloads.
        localStorage.removeItem("skipAuth");
        sessionStorage.setItem("skipAuth", "true");
      }

      if (skipAuth) {
        if (requireOnboarding) {
          const completed =
            typeof window !== "undefined" &&
            localStorage.getItem("onboardingComplete") === "true";
          if (!completed) {
            router.replace("/onboarding");
            return;
          }
        }
        if (active) setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      if (requireOnboarding) {
        const completed =
          typeof window !== "undefined" &&
          localStorage.getItem("onboardingComplete") === "true";
        if (!completed) {
          router.replace("/onboarding");
          return;
        }
      }

      if (active) setReady(true);
    }

    check();
    return () => {
      active = false;
    };
  }, [requireOnboarding, router]);

  return ready;
}

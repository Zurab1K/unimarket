"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getProfileByUserId, isOnboardingComplete } from "@/lib/supabaseData";

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
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      if (requireOnboarding) {
        const profile = await getProfileByUserId(session.user.id);

        if (!isOnboardingComplete(profile)) {
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

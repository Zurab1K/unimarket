"use client";

import { useAuthGuard } from "@/lib/useAuthGuard";

export default function SettingsPage() {
  const ready = useAuthGuard();

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-20">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-8 shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b15b46]">
            Settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#2a1714]">Account settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#745f59]">
            This section will contain profile and account settings. For now, you can review your current profile data on the profile page.
          </p>
        </section>

        <div className="rounded-[2rem] border border-[#eadccf] bg-white px-6 py-8 text-sm text-[#53433d] shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
          <p className="font-semibold text-[#2a1714]">Settings coming soon</p>
          <p className="mt-3 text-[#745f59]">
            We’re building out settings for notification preferences, account details, and privacy controls.
          </p>
        </div>
      </div>
    </main>
  );
}

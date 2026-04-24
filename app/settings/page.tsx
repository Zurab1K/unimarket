"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { supabase } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const ready = useAuthGuard();
  const router = useRouter();
  const [confirmationText, setConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!ready) return null;

  async function handleDeleteAccount() {
    if (confirmationText.trim() !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm account deletion.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      setDeleteError("Your session expired. Sign in again and retry.");
      setDeleting(false);
      return;
    }

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to delete account.");
      }

      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete account.");
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-20">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-8 shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#2a1714]">Account settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#745f59]">
            This section will contain profile and account settings. For now, you can review your current profile data on the profile page.
          </p>
        </section>

        <section className="rounded-[2rem] border border-[#eadccf] bg-white px-6 py-8 text-sm text-[#53433d] shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
          <p className="font-semibold text-[#2a1714]">Account controls</p>
          <p className="mt-3 max-w-2xl text-[#745f59]">
            More settings will land here over time. For now, you can review profile details on the profile page or permanently delete your account below.
          </p>
        </section>

        <section className="rounded-[2rem] border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.08)] px-6 py-8 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Danger Zone
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#2a1714]">Delete account</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#745f59]">
            This permanently deletes your profile, listings, saved items, messages, reviews, and account access. This action cannot be undone.
          </p>

          <div className="mt-6 max-w-xl space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#2a1714]">
                Type <span className="font-semibold">DELETE</span> to confirm
              </span>
              <input
                type="text"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="DELETE"
                disabled={deleting}
                className="w-full rounded-2xl border border-[#d7cdc3] bg-white px-4 py-3 text-sm text-[#2a1714] outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            {deleteError ? (
              <p className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-white/80 px-4 py-3 text-sm text-[rgb(var(--brand-primary))]">
                {deleteError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting || confirmationText.trim() !== "DELETE"}
              className="rounded-full bg-[rgb(var(--brand-primary))] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting account…" : "Delete account"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"error" | "info">("info");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (session) {
        setReady(true);
      }
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!password.trim() || !confirmPassword.trim()) {
      setNoticeTone("error");
      setNotice("Both password fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setNoticeTone("error");
      setNotice("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setNoticeTone("error");
      setNotice(error.message);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=success");
  }

  const noticeClasses =
    noticeTone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-gradient-to-b from-white via-red-50 to-red-100 px-4 py-4 sm:py-6">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.12),_transparent_60%)]" />
      <div className="absolute left-[-6rem] top-20 h-40 w-40 rounded-full bg-red-200/40 blur-3xl" />
      <div className="absolute bottom-8 right-[-4rem] h-44 w-44 rounded-full bg-red-300/30 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-[1.75rem] border border-red-100 bg-white/90 p-5 shadow-[0_22px_60px_rgba(127,29,29,0.12)] backdrop-blur sm:p-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-500">
            Password Recovery
          </p>
          <h1 className="mt-3 font-[family:var(--font-geist-sans)] text-4xl font-bold text-black sm:text-5xl">
            Reset your password
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-5 text-gray-600">
            Choose a new password for your UniMarket account, then return to login.
          </p>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          {!ready ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Open this page from the password recovery link in your email to set a new password.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-gray-700">New password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  placeholder="Enter a new password"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-gray-700">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  placeholder="Retype the new password"
                />
              </label>

              {notice ? (
                <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${noticeClasses}`}>
                  {notice}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 rounded-xl bg-red-600 px-6 py-2.5 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {submitting ? "Updating..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

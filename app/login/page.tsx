"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ensureInitialProfile,
  getProfileByUserId,
  isOnboardingComplete,
} from "@/lib/supabaseData";

type AuthAction = "Sign Up" | "Log In";
type NoticeTone = "error" | "info";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [action, setAction] = useState<AuthAction>("Log In");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [retypedPassword, setRetypedPassword] = useState("");
  const [shakeForm, setShakeForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        return;
      }

      const profile = await getProfileByUserId(session.user.id);

      if (isOnboardingComplete(profile)) {
        router.replace("/home");
      } else {
        router.replace("/onboarding");
      }
    })();
  }, [router]);

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setAction("Log In");
      setInfoNotice("Password updated. Log in with your new password.");
    }
  }, [searchParams]);

  function setErrorNotice(message: string) {
    setNoticeTone("error");
    setNotice(message);
  }

  function setInfoNotice(message: string) {
    setNoticeTone("info");
    setNotice(message);
  }

  async function handleSubmit() {
    if (action === "Sign Up") {
      if (!username.trim()) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorNotice("Username is required.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error || !data.user) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);
        setErrorNotice(error?.message || "Signup failed.");
        return;
      }

      if (!data.session) {
        setInfoNotice("Check your email to confirm your account, then log in to finish setup.");
        setAction("Log In");
        return;
      }

      const profileError = await ensureInitialProfile(data.user.id, username.trim());

      if (profileError !== null) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 300);

        if (profileError.code === "23505") {
          setErrorNotice("Username already taken.");
          return;
        }

        setErrorNotice(profileError.message);
        return;
      }

      setNotice("");
      router.push("/onboarding");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorNotice(error.message);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    let profile = await getProfileByUserId(session.user.id);

    if (!profile) {
      const fallbackUsername =
        typeof session.user.user_metadata?.username === "string" &&
        session.user.user_metadata.username.trim().length > 0
          ? session.user.user_metadata.username.trim()
          : email.split("@")[0]?.trim();

      if (!fallbackUsername) {
        setErrorNotice("Your account is missing a username. Contact the project admin.");
        return;
      }

      const profileError = await ensureInitialProfile(session.user.id, fallbackUsername);

      if (profileError) {
        setErrorNotice(profileError.message);
        return;
      }

      profile = await getProfileByUserId(session.user.id);
    }

    router.push(isOnboardingComplete(profile) ? "/home" : "/onboarding");
  }

  async function handlePrimaryAction() {
    if (isSubmitting) return;

    setNotice("");

    if (action === "Sign Up" && retypedPassword !== password) {
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 300);
      setErrorNotice("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSubmit();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (isSendingReset) return;

    if (!email.trim()) {
      setErrorNotice("Enter your email first so we can send the reset link.");
      return;
    }

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;

    setIsSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setIsSendingReset(false);

    if (error) {
      setErrorNotice(error.message);
      return;
    }

    setInfoNotice("Password reset email sent. Check your inbox and open the recovery link.");
  }

  const isSignUp = action === "Sign Up";
  const noticeClasses =
    noticeTone === "error"
      ? "border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] text-[rgb(var(--brand-primary))]"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(255,250,247,1),rgba(255,241,231,1))] px-4 py-3 sm:px-5 sm:py-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,140,65,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(137,37,37,0.16),_transparent_30%),linear-gradient(135deg,rgba(137,37,37,0.08),transparent_38%,rgba(232,140,65,0.10))]" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(232,140,65,0.18),_transparent_62%)]" />
      <div className="absolute left-[-7rem] top-16 h-56 w-56 rounded-full bg-[rgba(137,37,37,0.14)] blur-3xl" />
      <div className="absolute right-[-6rem] top-24 h-52 w-52 rounded-full bg-[rgba(232,140,65,0.16)] blur-3xl" />
      <div className="absolute bottom-6 right-[-5rem] h-56 w-56 rounded-full bg-[rgba(232,140,65,0.14)] blur-3xl" />
      <div className="fixed right-4 top-4 z-[60] pointer-events-auto sm:right-6 sm:top-6">
        <div className="inline-flex rounded-xl border border-[rgba(var(--brand-primary),0.18)] bg-white/90 p-1 shadow-sm backdrop-blur">
          {(["Log In", "Sign Up"] as AuthAction[]).map((option) => {
            const active = action === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAction(option);
                  setNotice("");
                }}
                className={`min-w-[5.5rem] rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:min-w-[6rem] sm:px-4 sm:text-sm ${
                  active
                    ? "bg-[rgb(var(--brand-accent))] text-white shadow-sm"
                    : "text-[rgb(var(--brand-primary))] hover:bg-white hover:text-[rgb(var(--brand-primary))]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative w-full max-w-md rounded-[1.5rem] border border-[rgba(var(--brand-primary),0.18)] bg-white/90 p-4 shadow-[0_22px_60px_rgba(127,29,29,0.12)] backdrop-blur sm:p-5">
        <div className="text-center">
          <div className="mx-auto flex w-fit flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[rgba(var(--brand-primary),0.18)] bg-white shadow-[0_10px_24px_rgba(127,29,29,0.10)] sm:h-[5.5rem] sm:w-[5.5rem]">
              <Image
                src="/unimarket-logo.png"
                alt="UniMarket logo"
                width={60}
                height={62}
                className="h-auto w-[60px] sm:w-16"
                priority
              />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[rgb(var(--brand-primary))]">
              UniMarket
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">
            Buy and sell on campus
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-5 text-gray-600 sm:text-sm">
            Dorm essentials, textbooks, electronics, and more from students already on your campus.
          </p>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">
              {isSignUp ? "Create your account" : "Log in to continue"}
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-gray-500 sm:text-sm">
              {isSignUp
                ? "Join the marketplace and set up your student profile."
                : "Return to your listings, onboarding, and chat."}
            </p>
          </div>

          <div className={`grid gap-2.5 ${shakeForm ? "animate-shake" : ""}`}>
            {isSignUp ? (
              <label className="grid gap-1">
                <span className="text-[13px] font-medium text-gray-700">Username</span>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-4 focus:ring-[rgba(var(--brand-accent),0.22)]"
                />
              </label>
            ) : null}

            <label className="grid gap-1">
              <span className="text-[13px] font-medium text-gray-700">Email</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-4 focus:ring-[rgba(var(--brand-accent),0.22)]"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-[13px] font-medium text-gray-700">Password</span>
              <input
                type="password"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-4 focus:ring-[rgba(var(--brand-accent),0.22)]"
              />
            </label>

            {!isSignUp ? (
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingReset}
                  className="text-sm font-medium text-[rgb(var(--brand-primary))] transition hover:text-[rgb(var(--brand-primary))] disabled:cursor-not-allowed disabled:text-[rgba(var(--brand-accent),0.5)]"
                >
                  {isSendingReset ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            ) : null}

            {isSignUp ? (
              <label className="grid gap-1">
                <span className="text-[13px] font-medium text-gray-700">Retype password</span>
                <input
                  type="password"
                  placeholder="Retype your password"
                  value={retypedPassword}
                  onChange={(event) => setRetypedPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-4 focus:ring-[rgba(var(--brand-accent),0.22)]"
                />
              </label>
            ) : null}

            {notice ? (
              <div className={`rounded-xl border px-4 py-2.5 text-sm leading-5 ${noticeClasses}`}>
                {notice}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isSubmitting}
              className="mt-0.5 rounded-xl bg-[rgb(var(--brand-accent))] px-6 py-2.5 text-base font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-[rgba(var(--brand-accent),0.45)]"
            >
              {isSubmitting ? "Please wait..." : action}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.08)] px-4 py-2.5 text-[13px] leading-5 text-gray-700 sm:text-sm">
          {isSignUp ? (
            <p>After sign-up, confirm your email if prompted, then log in to finish onboarding.</p>
          ) : (
            <p>Already confirmed your email? Log in here and UniMarket will continue your setup.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

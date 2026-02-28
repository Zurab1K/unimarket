"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ensureInitialProfile,
  getProfileByUserId,
  isOnboardingComplete,
} from "@/lib/supabaseData";

type AuthAction = "Sign Up" | "Log In";
type NoticeTone = "error" | "info";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [action, setAction] = useState<AuthAction>("Sign Up");
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
            Campus Marketplace
          </p>
          <h1 className="mt-3 font-[family:var(--font-geist-sans)] text-4xl font-bold text-black sm:text-5xl">
            Your Campus
          </h1>
          <h2 className="font-[family:var(--font-geist-sans)] text-4xl font-bold text-red-600 sm:text-5xl">
            UniMarket
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-5 text-gray-600">
            Buy and sell dorm essentials, textbooks, electronics, and more with students who are
            already on your campus.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-red-100 bg-red-50 p-1">
            {(["Sign Up", "Log In"] as AuthAction[]).map((option) => {
              const active = action === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setAction(option);
                    setNotice("");
                  }}
                  className={`min-w-28 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-red-600 hover:bg-white hover:text-red-700"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              {isSignUp ? "Create your account" : "Log in to continue"}
            </h3>
            <p className="mt-1.5 text-sm leading-5 text-gray-500">
              {isSignUp
                ? "Use your email to join the marketplace and set up your student profile."
                : "Pick up where you left off with your listings, onboarding, and chat."}
            </p>
          </div>

          <div className={`grid gap-3 ${shakeForm ? "animate-shake" : ""}`}>
            {isSignUp ? (
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-gray-700">Username</span>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </label>
            ) : null}

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                type="password"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            {!isSignUp ? (
              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isSendingReset}
                  className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
                >
                  {isSendingReset ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            ) : null}

            {isSignUp ? (
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-gray-700">Retype password</span>
                <input
                  type="password"
                  placeholder="Retype your password"
                  value={retypedPassword}
                  onChange={(event) => setRetypedPassword(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              </label>
            ) : null}

            {notice ? (
              <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${noticeClasses}`}>
                {notice}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isSubmitting}
              className="mt-1 rounded-xl bg-red-600 px-6 py-2.5 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isSubmitting ? "Please wait..." : action}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm leading-5 text-gray-700">
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

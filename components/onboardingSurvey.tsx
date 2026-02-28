"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useMultistepForms from "@/app/useMultistepForms";
import { supabase } from "@/lib/supabaseClient";
import {
  getProfileByUserId,
  isOnboardingComplete,
  saveProfileOnboarding,
} from "@/lib/supabaseData";

type FormState = {
  fullName: string;
  campus: string;
  major: string;
  interests: string[];
  budget: string;
  notifications: "" | "yes" | "no";
  contact: "" | "email" | "sms";
};

type FieldName =
  | "fullName"
  | "campus"
  | "major"
  | "interests"
  | "budget"
  | "notifications"
  | "contact";

type FieldErrors = Partial<Record<FieldName, string>>;

const INTEREST_OPTIONS = [
  "Textbooks",
  "Electronics",
  "Furniture",
  "Tutoring",
  "Ride shares",
  "Events",
];

const BUDGET_OPTIONS = ["<$50", "$50-$200", "$200-$500", "$500+"];

export default function OnboardingSurvey() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    fullName: "",
    campus: "",
    major: "",
    interests: [],
    budget: "",
    notifications: "",
    contact: "",
  });
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const getInputClasses = (field: FieldName) =>
    `w-full rounded-lg border px-3 py-2 text-gray-900 outline-none transition ${
      fieldErrors[field]
        ? "border-rose-500 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        : "border-gray-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
    }`;

  const clearFieldError = (field: FieldName) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (stepIndex: number) => {
    const nextErrors: FieldErrors = {};

    if (stepIndex === 0) {
      if (!form.fullName.trim()) nextErrors.fullName = "*Required";
      if (!form.campus.trim()) nextErrors.campus = "*Required";
      if (!form.major.trim()) nextErrors.major = "*Required";
    }

    if (stepIndex === 1 && form.interests.length === 0) {
      nextErrors.interests = "*Required";
    }

    if (stepIndex === 2) {
      if (!form.budget) nextErrors.budget = "*Required";
      if (!form.notifications) nextErrors.notifications = "*Required";
      if (!form.contact) nextErrors.contact = "*Required";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      const profile = await getProfileByUserId(session.user.id);

      if (!active) return;

      if (profile) {
        const completed = isOnboardingComplete(profile);
        setUsername(profile.username);
        setForm((prev) => ({
          ...prev,
          fullName: profile.full_name ?? "",
          campus: profile.campus ?? "",
          major: profile.major ?? "",
          interests: completed ? profile.interests : [],
          budget: completed ? (profile.budget ?? "") : "",
          notifications: completed ? (profile.notifications ? "yes" : "no") : "",
          contact:
            completed && (profile.contact === "email" || profile.contact === "sms")
              ? profile.contact
              : "",
        }));
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const toggleInterest = (interest: string) => {
    setErrorMessage("");
    clearFieldError("interests");
    setForm((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((item) => item !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  const stepContent = [
      (
        <div className="space-y-6" key="basics">
          <div>
            <p className="text-sm font-semibold text-rose-600">Step 1</p>
            <h3 className="text-2xl font-bold text-gray-900">Tell us about you</h3>
            <p className="text-sm text-gray-600">
              We’ll tailor recommendations to your campus and interests.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="flex items-center justify-between text-sm text-gray-700">
                <span>Full name</span>
                {fieldErrors.fullName ? <span className="font-medium text-rose-600">{fieldErrors.fullName}</span> : null}
              </span>
              <input
                className={getInputClasses("fullName")}
                value={form.fullName}
                onChange={(e) => {
                  clearFieldError("fullName");
                  setForm((prev) => ({ ...prev, fullName: e.target.value }));
                }}
                placeholder="Jane Doe"
                aria-invalid={Boolean(fieldErrors.fullName)}
              />
            </label>
            <label className="space-y-1">
              <span className="flex items-center justify-between text-sm text-gray-700">
                <span>Campus</span>
                {fieldErrors.campus ? <span className="font-medium text-rose-600">{fieldErrors.campus}</span> : null}
              </span>
              <input
                className={getInputClasses("campus")}
                value={form.campus}
                onChange={(e) => {
                  clearFieldError("campus");
                  setForm((prev) => ({ ...prev, campus: e.target.value }));
                }}
                placeholder="Stony Brook"
                aria-invalid={Boolean(fieldErrors.campus)}
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="flex items-center justify-between text-sm text-gray-700">
                <span>Major / focus</span>
                {fieldErrors.major ? <span className="font-medium text-rose-600">{fieldErrors.major}</span> : null}
              </span>
              <input
                className={getInputClasses("major")}
                value={form.major}
                onChange={(e) => {
                  clearFieldError("major");
                  setForm((prev) => ({ ...prev, major: e.target.value }));
                }}
                placeholder="Computer Science"
                aria-invalid={Boolean(fieldErrors.major)}
              />
            </label>
          </div>
        </div>
      ),
      (
        <div className="space-y-6" key="interests">
          <div>
            <p className="text-sm font-semibold text-rose-600">Step 2</p>
            <h3 className="text-2xl font-bold text-gray-900">Pick your interests</h3>
            <p className="text-sm text-gray-600">
              Choose a few categories so we can surface the best matches.
            </p>
          </div>

          <div
            className={`rounded-2xl border p-4 transition ${
              fieldErrors.interests ? "border-rose-500 bg-rose-50/70" : "border-gray-200 bg-white"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Choose at least one interest</p>
              {fieldErrors.interests ? (
                <span className="text-sm font-medium text-rose-600">{fieldErrors.interests}</span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = form.interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-rose-300"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
            </div>
          </div>
        </div>
      ),
      (
        <div className="space-y-6" key="preferences">
          <div>
            <p className="text-sm font-semibold text-rose-600">Step 3</p>
            <h3 className="text-2xl font-bold text-gray-900">Shopping preferences</h3>
            <p className="text-sm text-gray-600">
              Fill out every preference so we can personalize your feed.
            </p>
          </div>

          <div className="space-y-5">
            <div
              className={`rounded-2xl border p-4 transition ${
                fieldErrors.budget ? "border-rose-500 bg-rose-50/70" : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Typical budget</p>
                {fieldErrors.budget ? (
                  <span className="text-sm font-medium text-rose-600">{fieldErrors.budget}</span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BUDGET_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => {
                      clearFieldError("budget");
                      setForm((prev) => ({
                        ...prev,
                        budget: option,
                      }));
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      form.budget === option
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-rose-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 transition ${
                fieldErrors.notifications ? "border-rose-500 bg-rose-50/70" : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Send me new match notifications</p>
                  <p className="text-xs text-gray-500">Choose whether UniMarket can notify you about new matches.</p>
                </div>
                {fieldErrors.notifications ? (
                  <span className="text-sm font-medium text-rose-600">{fieldErrors.notifications}</span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      clearFieldError("notifications");
                      setForm((prev) => ({
                        ...prev,
                        notifications: option.value as FormState["notifications"],
                      }));
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      form.notifications === option.value
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-rose-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 transition ${
                fieldErrors.contact ? "border-rose-500 bg-rose-50/70" : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Preferred contact method</p>
                  <p className="text-xs text-gray-500">Tell us how you want to hear from the platform.</p>
                </div>
                {fieldErrors.contact ? (
                  <span className="text-sm font-medium text-rose-600">{fieldErrors.contact}</span>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["email", "sms"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => {
                      clearFieldError("contact");
                      setForm((prev) => ({
                        ...prev,
                        contact: option as FormState["contact"],
                      }));
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize transition ${
                      form.contact === option
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-rose-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    ];

  const { steps, currentStepIndex, step, isFirstStep, isLastStep, back, next } =
    useMultistepForms(stepContent);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!isLastStep) {
      if (!validateStep(currentStepIndex)) {
        return;
      }
      next();
      return;
    }

    if (!validateStep(currentStepIndex)) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    if (!username.trim()) {
      setErrorMessage("Your profile is missing a username. Please sign out and sign up again.");
      return;
    }

    setSaving(true);
    const error = await saveProfileOnboarding({
      id: session.user.id,
      username,
      fullName: form.fullName,
      campus: form.campus,
      major: form.major,
      interests: form.interests,
      budget: form.budget,
      notifications: form.notifications === "yes",
      contact: form.contact,
    });
    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/home");
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-600 shadow-xl">
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
            Onboarding
          </p>
          <h2 className="text-xl font-bold text-gray-900">Create your personalized feed</h2>
        </div>
        <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
          Step {currentStepIndex + 1} / {steps.length}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        {step}

        {errorMessage ? <p className="text-sm font-medium text-rose-700">{errorMessage}</p> : null}

        <div className="flex items-center justify-between pt-4">
          {!isFirstStep ? (
            <button
              type="button"
              onClick={back}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {saving ? "Saving..." : isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}

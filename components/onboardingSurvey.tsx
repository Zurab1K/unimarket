"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useMultistepForms from "@/app/useMultistepForms";

type FormState = {
  fullName: string;
  campus: string;
  major: string;
  interests: string[];
  budget: string;
  notifications: boolean;
  contact: "email" | "sms";
};

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
    budget: "$50-$200",
    notifications: true,
    contact: "email",
  });

  const toggleInterest = (interest: string) => {
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

  const stepContent = useMemo(
    () => [
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
              <span className="text-sm text-gray-700">Full name</span>
              <input
                className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Jane Doe"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-gray-700">Campus</span>
              <input
                className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                value={form.campus}
                onChange={(e) => setForm((prev) => ({ ...prev, campus: e.target.value }))}
                placeholder="Stony Brook"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm text-gray-700">Major / focus</span>
              <input
                className="w-full rounded-lg border px-3 py-2 text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                value={form.major}
                onChange={(e) => setForm((prev) => ({ ...prev, major: e.target.value }))}
                placeholder="Computer Science"
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
      ),
      (
        <div className="space-y-6" key="preferences">
          <div>
            <p className="text-sm font-semibold text-rose-600">Step 3</p>
            <h3 className="text-2xl font-bold text-gray-900">Shopping preferences</h3>
            <p className="text-sm text-gray-600">
              Let us know how you want to be notified and your typical budget.
            </p>
          </div>

          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm text-gray-700">Typical budget</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BUDGET_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setForm((prev) => ({ ...prev, budget: option }))}
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
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <input
                  id="notifications"
                  type="checkbox"
                  checked={form.notifications}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notifications: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="notifications" className="text-sm text-gray-700">
                  Send me new match notifications
                </label>
              </div>

              <div className="flex gap-2">
                {["email", "sms"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, contact: option as FormState["contact"] }))
                    }
                    className={`rounded-full border px-3 py-2 text-sm capitalize transition ${
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
    ],
    [form],
  );

  const { steps, currentStepIndex, step, isFirstStep, isLastStep, back, next } =
    useMultistepForms(stepContent);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLastStep) {
      next();
      return;
    }

    // TODO: hook this up to Supabase or the API once available.
    console.log("Onboarding responses", form);
    if (typeof window !== "undefined") {
      localStorage.setItem("onboardingComplete", "true");
    }
    router.push("/home");
  };

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
            className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}

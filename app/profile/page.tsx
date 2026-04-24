"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { supabase } from "@/lib/supabaseClient";
import {
  getProfileByUserId,
  saveProfileOnboarding,
  getReviewsForUser,
  type ProfileUpsertInput,
  type UserProfile,
  type Review,
} from "@/lib/supabaseData";

type EditableFieldKey = "full_name" | "username" | "campus" | "major";

const EDITABLE_FIELDS: Array<{
  key: EditableFieldKey;
  label: string;
  placeholder: string;
}> = [
  { key: "full_name", label: "Full name", placeholder: "Jane Doe" },
  { key: "username", label: "Username", placeholder: "janedoe" },
  { key: "campus", label: "Campus", placeholder: "Stony Brook" },
  { key: "major", label: "Major / focus", placeholder: "Computer Science" },
];

export default function ProfilePage() {
  const ready = useAuthGuard();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableFieldKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (!session) {
        setError("Not authenticated.");
        setLoading(false);
        return;
      }

      const profileData = await getProfileByUserId(session.user.id);
      if (!active) return;

      if (!profileData) {
        setError("No profile found. Please complete onboarding first.");
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setLoading(false);

      // Fetch reviews for this user
      setReviewsLoading(true);
      const { data: reviewsData, error: reviewsError } = await getReviewsForUser(session.user.id);
      if (!active) return;

      if (reviewsError) {
        console.error("Failed to load reviews:", reviewsError);
      } else {
        setReviews(reviewsData);
      }
      setReviewsLoading(false);
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [ready]);

  const startEdit = (field: EditableFieldKey) => {
    if (!profile) return;
    setSuccessMessage(null);
    setFieldError(null);
    setEditingField(field);
    setEditValue(profile[field] ?? "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
    setFieldError(null);
  };

  const handleSaveField = async () => {
    if (!profile || !editingField) return;
    const value = editValue.trim();

    if (!value) {
      setFieldError("This field cannot be empty.");
      return;
    }

    setSaving(true);
    setFieldError(null);
    setError(null);

    const input: ProfileUpsertInput = {
      id: profile.id,
      username:
        editingField === "username" ? value : profile.username ?? "",
      fullName:
        editingField === "full_name"
          ? value
          : profile.full_name ?? "",
      campus: editingField === "campus" ? value : profile.campus ?? "",
      major: editingField === "major" ? value : profile.major ?? "",
      interests: profile.interests,
      budget: profile.budget ?? "",
      notifications: profile.notifications,
      contact: profile.contact ?? "",
    };

    const saveError = await saveProfileOnboarding(input);
    setSaving(false);

    if (saveError) {
      setError(saveError.message ?? "Failed to save profile.");
      return;
    }

    setProfile({
      ...profile,
      username: input.username,
      full_name: input.fullName,
      campus: input.campus,
      major: input.major,
    });
    setEditingField(null);
    setSuccessMessage("Personal information saved successfully.");
  };

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-20">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-8 shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#2a1714]">Your onboarding details</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#745f59]">
            This page shows the data you provided during onboarding. You can use it to confirm your campus,
            major, interests, and contact preferences.
          </p>
        </section>

        {loading && (
          <div className="rounded-[2rem] border border-[#eadccf] bg-white px-6 py-8 text-center text-sm text-[#8a736b]">
            Loading profile…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[2rem] border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-6 py-8 text-sm text-[rgb(var(--brand-primary))]">
            {error}
          </div>
        )}

        {successMessage && !loading && !error && (
          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {profile && !loading && !error && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-[#eadccf] bg-white p-6 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                    Personal information
                  </p>
                  <p className="mt-2 text-sm text-[#745f59]">
                    Edit the details you shared during onboarding.
                  </p>
                </div>
                {editingField === null ? null : (
                  <div className="rounded-full bg-[#f4f1ed] px-3 py-1 text-xs font-medium text-[#7a5d4c]">
                    Editing {EDITABLE_FIELDS.find((item) => item.key === editingField)?.label}
                  </div>
                )}
              </div>

              <dl className="mt-6 space-y-5 text-sm text-[#53433d]">
                {EDITABLE_FIELDS.map((field) => {
                  const isEditing = editingField === field.key;
                  const currentValue = profile[field.key] ?? "";

                  return (
                    <div key={field.key} className="space-y-2 rounded-3xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="font-medium text-[#2a1714]">{field.label}</dt>
                        <button
                          type="button"
                          disabled={saving && !isEditing}
                          onClick={() => (isEditing ? cancelEdit() : startEdit(field.key))}
                          className="rounded-full border border-[#e8dcd3] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a5d4c] transition hover:bg-[#f6f0ec] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isEditing ? "Cancel" : "Edit"}
                        </button>
                      </div>

                      <dd className="mt-1">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(event) => setEditValue(event.target.value)}
                              placeholder={field.placeholder}
                              className="w-full rounded-2xl border border-[#d7cdc3] bg-white px-4 py-3 text-sm text-[#2a1714] outline-none transition focus:border-[rgb(var(--brand-accent))] focus:ring-2 focus:ring-[rgba(var(--brand-accent),0.22)]"
                            />
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={handleSaveField}
                                disabled={saving}
                                className="rounded-full bg-[rgb(var(--brand-accent))] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {saving ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                                className="rounded-full border border-[#d7cdc3] bg-white px-4 py-2 text-sm font-semibold text-[#53433d] transition hover:border-[#b8aea4] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                            {fieldError ? (
                              <p className="text-sm text-[rgb(var(--brand-primary))]">{fieldError}</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-sm text-[#53433d]">
                            {currentValue || "—"}
                          </p>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            <div className="rounded-[2rem] border border-[#eadccf] bg-white p-6 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Preferences
              </p>
              <dl className="mt-6 space-y-5 text-sm text-[#53433d]">
                <div>
                  <dt className="font-medium text-[#2a1714]">Interests</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {profile.interests.length > 0 ? (
                      profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-[#f4e6dd] px-3 py-1 text-xs font-medium text-[#7a5d4c]"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8a736b]">No interests selected</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-[#2a1714]">Budget</dt>
                  <dd className="mt-1">{profile.budget ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#2a1714]">Contact preference</dt>
                  <dd className="mt-1">{profile.contact ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#2a1714]">Notifications</dt>
                  <dd className="mt-1">{profile.notifications ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-2 rounded-[2rem] border border-[#eadccf] bg-white p-6 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                    Reviews & ratings
                  </p>
                  <p className="mt-2 text-sm text-[#745f59]">
                    Feedback from other UniMarket users
                  </p>
                </div>
              </div>

              {reviewsLoading ? (
                <p className="text-sm text-[#8a736b]">Loading reviews…</p>
              ) : reviews.length > 0 ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#2a1714]">
                        {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            color={
                              star <=
                              Math.round(
                                reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                              )
                                ? "rgb(var(--brand-accent))"
                                : "#e8dcd3"
                            }
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-[#745f59]">
                        ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill={star <= review.rating ? "rgb(var(--brand-accent))" : "#e8dcd3"}
                                >
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs font-medium text-[#7a5d4c]">
                              {review.rating}.0
                            </span>
                          </div>
                          <p className="text-xs text-[#8a736b]">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-[#2a1714]">
                            {review.reviewerUsername}
                          </p>
                        </div>

                        {review.comment && (
                          <p className="text-sm text-[#53433d]">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#8a736b]">No reviews yet</p>
              )}
            </div>

            <div className="lg:col-span-2 rounded-[2rem] border border-[#eadccf] bg-white p-6 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Account metadata
              </p>
              <dl className="mt-6 grid gap-5 text-sm text-[#53433d] sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-[#2a1714]">Profile created</dt>
                  <dd className="mt-1">{profile.created_at ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#2a1714]">Last updated</dt>
                  <dd className="mt-1">{profile.updated_at ?? "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

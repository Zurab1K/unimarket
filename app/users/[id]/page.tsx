"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import { useAuthGuard } from "@/lib/useAuthGuard";
import {
  fetchListingsForSeller,
  getProfileByUserId,
  getReviewsForUser,
  type ListingRecord,
  type Review,
  type UserProfile,
} from "@/lib/supabaseData";

export default function PublicProfilePage() {
  const ready = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !userId) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const [profileData, listingsResult, reviewsResult] = await Promise.all([
        getProfileByUserId(userId),
        fetchListingsForSeller(userId),
        getReviewsForUser(userId),
      ]);

      if (!active) return;

      if (!profileData) {
        setError("Profile not found.");
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setListings(listingsResult.data);
      setReviews(reviewsResult.data);

      if (listingsResult.error && !reviewsResult.error) {
        setError("Profile loaded, but listings could not be retrieved.");
      } else if (!listingsResult.error && reviewsResult.error) {
        setError("Profile loaded, but reviews could not be retrieved.");
      } else if (listingsResult.error && reviewsResult.error) {
        setError("Profile loaded, but listings and reviews could not be retrieved.");
      }

      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [ready, userId]);

  if (!ready) return null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0ea]">
        <p className="text-sm text-[#8a736b]">Loading profile…</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f0ea] px-4">
        <p className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-6 py-4 text-sm text-[rgb(var(--brand-primary))]">
          {error ?? "Profile not found."}
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-[rgb(var(--brand-primary))] underline underline-offset-2"
        >
          Go back
        </button>
      </main>
    );
  }

  const initials = (profile.full_name ?? profile.username ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-[#7a5a52] transition hover:text-[rgb(var(--brand-primary))]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        {error && (
          <p className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-5 py-4 text-sm text-[rgb(var(--brand-primary))]">
            {error}
          </p>
        )}

        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-8 shadow-[0_12px_30px_rgba(75,36,28,0.06)] sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(var(--brand-accent),0.16)] text-2xl font-bold text-[rgb(var(--brand-primary))]">
                  {initials}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2a1714]">
                    {profile.full_name ?? profile.username}
                  </h1>
                  {profile.full_name ? (
                    <p className="mt-1 text-sm text-[#8a736b]">@{profile.username}</p>
                  ) : null}
                </div>
              </div>

              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <InfoRow label="Campus" value={profile.campus} />
                <InfoRow label="Major" value={profile.major} />
                <InfoRow label="Member since" value={memberSince} />
                <InfoRow
                  label="Active listings"
                  value={`${listings.length} item${listings.length === 1 ? "" : "s"}`}
                />
              </dl>
            </div>

            <div className="rounded-[1.75rem] border border-[#f0e7e0] bg-[#fcfaf7] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Seller rating
              </p>
              {averageRating !== null ? (
                <div className="mt-4">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-[#2a1714]">
                      {averageRating.toFixed(1)}
                    </span>
                    <div className="pb-1">
                      <StarRow rating={averageRating} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#745f59]">
                    Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#8a736b]">No reviews yet</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-7 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Active Listings
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold text-[#2a1714]">
                Items this seller has available
              </h2>
            </div>
            <div className="rounded-full bg-[#f1e4dc] px-4 py-2 text-sm font-medium text-[#855246]">
              {listings.length} active item{listings.length === 1 ? "" : "s"}
            </div>
          </div>

          {listings.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {listings.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  location={[item.location, item.category].filter(Boolean).join(" • ")}
                  price={`$${item.price}`}
                  image={item.images[0] ?? "/placeholder-avatar-picture.jpg"}
                />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[#8a736b]">No active listings right now.</p>
          )}
        </section>

        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-7 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
              Reviews & Ratings
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold text-[#2a1714]">
              What other buyers say
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-[#2a1714]">
                    {averageRating?.toFixed(1)}
                  </span>
                  <StarRow rating={averageRating ?? 0} />
                  <span className="text-sm text-[#745f59]">
                    ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <StarRow rating={review.rating} small />
                        <span className="text-xs font-medium text-[#7a5d4c]">
                          {review.rating}.0
                        </span>
                      </div>
                      <p className="text-xs text-[#8a736b]">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="text-sm font-medium text-[#2a1714]">
                      {review.reviewerUsername}
                    </p>

                    {review.comment ? (
                      <p className="mt-2 text-sm text-[#53433d]">{review.comment}</p>
                    ) : (
                      <p className="mt-2 text-sm text-[#8a736b]">No written comment.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[#8a736b]">No reviews yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-4 py-3">
      <dt className="font-medium text-[#2a1714]">{label}</dt>
      <dd className="mt-1 text-[#53433d]">{value ?? "—"}</dd>
    </div>
  );
}

function StarRow({
  rating,
  small = false,
}: {
  rating: number;
  small?: boolean;
}) {
  const rounded = Math.round(rating);
  const sizeClass = small ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          className={sizeClass}
          viewBox="0 0 24 24"
          fill={star <= rounded ? "rgb(var(--brand-accent))" : "#e8dcd3"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

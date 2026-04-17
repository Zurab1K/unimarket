"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthGuard } from "@/lib/useAuthGuard";
import {
  fetchListing,
  fetchSavedListingIds,
  saveListing,
  unsaveListing,
  type ListingRecord,
} from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  sold: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function ListingDetailPage() {
  const ready = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function load() {
      setLoading(true);

      const [
        { data: { user } },
        listingResult,
        savedIds,
      ] = await Promise.all([
        supabase.auth.getUser(),
        fetchListing(id),
        fetchSavedListingIds(),
      ]);

      if (!active) return;

      if (listingResult.error || !listingResult.data) {
        setError(listingResult.error?.message ?? "Listing not found.");
      } else {
        setListing(listingResult.data);
        setLiked(savedIds.includes(id));
      }

      setCurrentUserId(user?.id ?? null);
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [ready, id]);

  async function handleHeart() {
    const next = !liked;
    setLiked(next);
    if (next) {
      await saveListing(id);
    } else {
      await unsaveListing(id);
    }
  }

  if (!ready || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0ea]">
        <p className="text-sm text-[#8a736b]">Loading listing…</p>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f0ea] px-4">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error ?? "Listing not found."}
        </p>
        <Link href="/" className="text-sm font-medium text-[#b15b46] underline underline-offset-2">
          Back to marketplace
        </Link>
      </main>
    );
  }

  const images = listing.images.length > 0
    ? listing.images
    : ["/placeholder-avatar-picture.jpg"];

  const isOwner = currentUserId === listing.sellerId;
  const statusStyle = STATUS_STYLES[listing.status] ?? STATUS_STYLES["available"];

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto w-full max-w-5xl">

        {/* Back nav */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#7a5a52] transition hover:text-[#b15b46]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

          {/* ── Images ────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-8 lg:w-[52%]">
            {/* Main image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_16px_40px_rgba(63,27,21,0.1)]">
              <Image
                src={images[activeImage]}
                alt={listing.title}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 1024px) 100vw, 52vw"
                priority
              />
              {/* Status badge */}
              <span className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>
                {listing.status}
              </span>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === i
                        ? "border-[#b15b46]"
                        : "border-[#e0cfc6] hover:border-[#c49080]"
                    }`}
                  >
                    <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ───────────────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col gap-6">

            {/* Title + heart */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold leading-snug text-[#2a1714] sm:text-3xl">
                {listing.title}
              </h1>
              <button
                type="button"
                onClick={handleHeart}
                aria-label={liked ? "Remove from saved" : "Save listing"}
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  liked
                    ? "border-[#b15b46] bg-[#fdf0eb]"
                    : "border-[#e0cfc6] bg-[#faf5f2] hover:border-[#b15b46] hover:bg-[#fdf0eb]"
                }`}
              >
                <Image
                  src={liked ? "/heartfilled.png" : "/heart.png"}
                  alt=""
                  width={20}
                  height={20}
                  className={liked ? "" : "opacity-50"}
                />
              </button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-[#b15b46]">
                ${listing.price.toFixed(2)}
              </span>
              {listing.isNegotiable && (
                <span className="rounded-full border border-[#e0cfc6] bg-[#faf0ea] px-3 py-1 text-xs font-medium text-[#8a5a45]">
                  Negotiable
                </span>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2">
              {listing.category && (
                <Chip icon="🏷️" label={listing.category} />
              )}
              {listing.condition && (
                <Chip icon="✨" label={CONDITION_LABELS[listing.condition] ?? listing.condition} />
              )}
              {listing.location && (
                <Chip icon="📍" label={listing.location} />
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-5 py-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#a06050]">
                  Description
                </p>
                <p className="whitespace-pre-line text-sm leading-7 text-[#4a2e27]">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Posted date */}
            <p className="text-xs text-[#9a8078]">
              Posted {formatRelativeAge(listing.createdAt)}
              {listing.updatedAt && listing.updatedAt !== listing.createdAt && (
                <> · Updated {formatRelativeAge(listing.updatedAt)}</>
              )}
            </p>

            {/* CTA */}
            {!isOwner && listing.status === "available" && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push(`/messages?sellerId=${listing.sellerId}`)}
                  className="flex-1 rounded-full bg-[#b15b46] py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#9a4c38] active:scale-[0.97]"
                >
                  Contact seller
                </button>
                <button
                  type="button"
                  onClick={handleHeart}
                  className={`flex-1 rounded-full border py-3.5 text-sm font-semibold transition active:scale-[0.97] ${
                    liked
                      ? "border-[#b15b46] bg-[#fdf0eb] text-[#b15b46]"
                      : "border-[#e0cfc6] bg-[#faf5f2] text-[#6d4037] hover:bg-[#f1e4dc]"
                  }`}
                >
                  {liked ? "Saved ♥" : "Save listing"}
                </button>
              </div>
            )}

            {!isOwner && (
              <button
                type="button"
                onClick={() => router.push(`/users/${listing.sellerId}`)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] active:scale-[0.97]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                View seller profile
              </button>
            )}

            {/* Owner actions */}
            {isOwner && (
              <Link
                href="/my-listings"
                className="inline-flex items-center gap-2 rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-5 py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z" />
                </svg>
                Edit in My Listings
              </Link>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-3 py-1.5 text-xs font-medium text-[#4a2e27]">
      <span>{icon}</span>
      {label}
    </span>
  );
}

function formatRelativeAge(createdAt: string) {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "";
  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) {
    const hours = Math.round(diffMinutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(diffMinutes / 1440);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
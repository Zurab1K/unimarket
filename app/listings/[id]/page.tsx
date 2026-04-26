"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import FallbackImage from "@/components/FallbackImage";
import { DEFAULT_IMAGE_SRC } from "@/lib/imageSources";
import { addListingToCart } from "@/lib/cart";
import { useAuthGuard } from "@/lib/useAuthGuard";
import {
  fetchListing,
  fetchSavedListingIds,
  getProfileByUserId,
  saveListing,
  unsaveListing,
  type ListingRecord,
  type UserProfile,
} from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";
import LocationMap from "@/components/LocationMap";
import { DEFAULT_MAP_CENTER, parseMeetupPoints } from "@/lib/location";

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
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

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
        const profile = await getProfileByUserId(listingResult.data.sellerId);
        if (!active) return;
        setSellerProfile(profile);
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
      const error = await saveListing(id);
      if (error) {
        setLiked(false);
      }
    } else {
      const error = await unsaveListing(id);
      if (error) {
        setLiked(true);
      }
    }
  }

  function showPreviousImage() {
    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function showNextImage() {
    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  function handleAddToCart() {
    if (!listing) return;
    const next = addListingToCart(listing);
    const cartItem = next.find((item) => item.id === listing.id);
    const quantity = cartItem?.quantity ?? 1;
    setCartNotice(
      quantity > 1
        ? `Added again. ${quantity} in your cart.`
        : "Added to cart.",
    );
  }

  function handleBuyNow() {
    if (!listing) return;
    addListingToCart(listing);
    router.push("/cart");
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
        <p className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-6 py-4 text-sm text-[rgb(var(--brand-primary))]">
          {error ?? "Listing not found."}
        </p>
        <Link href="/" className="text-sm font-medium text-[rgb(var(--brand-primary))] underline underline-offset-2">
          Back to marketplace
        </Link>
      </main>
    );
  }

  const images = listing.images.length > 0
    ? listing.images
    : [DEFAULT_IMAGE_SRC];

  const isOwner = currentUserId === listing.sellerId;
  const statusStyle = STATUS_STYLES[listing.status] ?? STATUS_STYLES["available"];
  const sellerDisplayName =
    sellerProfile?.full_name?.trim() || sellerProfile?.username || "Seller";
  const sellerInitials = sellerDisplayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sellerMemberSince = sellerProfile?.created_at
    ? new Date(sellerProfile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;
  const meetupPoints = parseMeetupPoints(listing.location);
  const meetupPoint =
    meetupPoints.length > 0
      ? ([meetupPoints[0].lat, meetupPoints[0].lng] as [number, number])
      : null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto w-full max-w-5xl">

        {/* Back nav */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#7a5a52] transition hover:text-[rgb(var(--brand-primary))]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">

          {/* ── Images ────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:w-[52%]">
            {/* Main image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_16px_40px_rgba(63,27,21,0.1)]">
              <FallbackImage
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

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    aria-label="Previous photo"
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-[rgba(42,23,20,0.44)] text-white shadow-[0_10px_24px_rgba(24,10,8,0.18)] backdrop-blur-sm transition hover:bg-[rgba(42,23,20,0.58)] active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    aria-label="Next photo"
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-[rgba(42,23,20,0.44)] text-white shadow-[0_10px_24px_rgba(24,10,8,0.18)] backdrop-blur-sm transition hover:bg-[rgba(42,23,20,0.58)] active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}
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
                        ? "border-[rgb(var(--brand-accent))]"
                        : "border-[#e0cfc6] hover:border-[#c49080]"
                    }`}
                  >
                    <FallbackImage src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}

            {!isOwner && (
              <div className="rounded-[1.75rem] border border-[#eadccf] bg-[#fffaf6] px-5 py-5 shadow-[0_12px_30px_rgba(75,36,28,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--brand-primary))]">
                  Seller
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(var(--brand-accent),0.16)] text-lg font-bold text-[rgb(var(--brand-primary))]">
                    {sellerInitials || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-[#2a1714]">
                      {sellerDisplayName}
                    </p>
                    {sellerProfile?.full_name && sellerProfile.username && (
                      <p className="mt-0.5 text-sm text-[#8a736b]">
                        @{sellerProfile.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-sm">
                  <SellerInfoRow label="Campus" value={sellerProfile?.campus} />
                  <SellerInfoRow label="Major" value={sellerProfile?.major} />
                  <SellerInfoRow label="Member since" value={sellerMemberSince} />
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push(`/messages?sellerId=${listing.sellerId}`)}
                    className="flex-1 rounded-full bg-[rgb(var(--brand-accent))] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97]"
                  >
                    Contact seller
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/users/${listing.sellerId}`)}
                    className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] active:scale-[0.97]"
                  >
                    View profile
                  </button>
                </div>
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
                    ? "border-[rgb(var(--brand-accent))] bg-[rgba(var(--brand-accent),0.14)]"
                    : "border-[#e0cfc6] bg-[#faf5f2] hover:border-[rgb(var(--brand-accent))] hover:bg-[rgba(var(--brand-accent),0.14)]"
                }`}
              >
                <FallbackImage
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
              <span className="text-4xl font-bold text-[rgb(var(--brand-primary))]">
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
                <Chip icon="📍" label={meetupPoints[0]?.label || "Campus meetup"} />
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

            <div className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-5 py-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#a06050]">
                Meetup location
              </p>
              <p className="mb-2 text-xs font-semibold text-[#8a736b]">
                Meetup zone: {meetupPoints.map((point) => point.label).join(", ") || "Campus meetup point"}
              </p>
              <p className="mb-3 text-sm text-[#4a2e27]">
                {meetupPoints.map((point) => point.label).join(", ") || "Campus meetup point"}
              </p>
              <LocationMap
                center={meetupPoint ?? DEFAULT_MAP_CENTER}
                marker={meetupPoint}
                markers={meetupPoints}
                selectedMarkerIds={meetupPoints.map((point) => point.id)}
                readOnly
              />
            </div>

            {/* Posted date */}
            <p className="text-xs text-[#9a8078]">
              Posted {formatRelativeAge(listing.createdAt)}
              {listing.updatedAt && listing.updatedAt !== listing.createdAt && (
                <> · Updated {formatRelativeAge(listing.updatedAt)}</>
              )}
            </p>

            {cartNotice && (
              <p className="rounded-2xl border border-[rgba(var(--brand-accent),0.24)] bg-[rgba(var(--brand-accent),0.12)] px-4 py-3 text-sm font-medium text-[rgb(var(--brand-primary))]">
                {cartNotice}
              </p>
            )}

            {/* CTA */}
            {!isOwner && listing.status === "available" && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 rounded-full bg-[rgb(var(--brand-accent))] py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97]"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 rounded-full bg-[rgb(var(--brand-primary))] py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97]"
                >
                  Buy Now
                </button>
              </div>
            )}

            {/* Owner actions */}
            {isOwner && (
              <Link
                href="/listings"
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

function SellerInfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-4 py-3">
      <span className="font-medium text-[#2a1714]">{label}</span>
      <span className="text-right text-[#53433d]">{value ?? "—"}</span>
    </div>
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

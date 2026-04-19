"use client";

import ListingCard from "@/components/ListingCard";
import ListingFormModal from "@/components/ListingFormModal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchListings, fetchSavedListingIds, type ListingRecord } from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";

type ListingCardViewModel = {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  date: number;
};

function formatRelativeAge(createdAt: string) {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "";

  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - timestamp) / 60000),
  );

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) {
    const hours = Math.round(diffMinutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(diffMinutes / 1440);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toViewModel(listing: ListingRecord): ListingCardViewModel {
  const parts = [listing.location, formatRelativeAge(listing.createdAt)].filter(
    Boolean,
  );
  return {
    id: listing.id,
    title: listing.title,
    location: parts.join(" • ") || listing.category,
    price: listing.price,
    image: listing.images[0] ?? "/placeholder-avatar-picture.jpg",
    date:
      Math.max(
        1,
        Math.round((Date.now() - Date.parse(listing.createdAt || "")) / 60000),
      ) || Number.MAX_SAFE_INTEGER,
  };
}

export default function MarketplaceHome() {
  const [listings, setListings] = useState<ListingCardViewModel[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [hiddenOwnListingsCount, setHiddenOwnListingsCount] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const ready = useAuthGuard();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingListings(true);
      const [result, saved, authResult] = await Promise.all([
        fetchListings(),
        fetchSavedListingIds(),
        supabase.auth.getUser(),
      ]);
      if (!active) return;

      const currentUserId = authResult.data.user?.id ?? null;

      if (result.error) {
        setListingsError(result.error.message);
        setListings([]);
        setHiddenOwnListingsCount(0);
      } else {
        const availableListings = result.data.filter((listing) => listing.status === "available");
        const ownListings = currentUserId
          ? availableListings.filter((listing) => listing.sellerId === currentUserId)
          : [];

        setListings(
          availableListings
            .filter((listing) => listing.sellerId !== currentUserId)
            .map(toViewModel),
        );
        setHiddenOwnListingsCount(ownListings.length);
        setSavedIds(new Set(saved));
        setListingsError(null);
      }
      setLoadingListings(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;

  return (
    <main className="w-full">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#4a1716] bg-[url('/sbu-background-image1.jpg')] bg-cover bg-center px-4 py-24">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,13,11,0.58),rgba(58,20,16,0.72)),radial-gradient(circle_at_top,rgba(255,244,229,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,198,141,0.2),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(49,19,16,0.52),rgba(49,19,16,0.2),rgba(49,19,16,0.52))]" />
        <div className="absolute left-[-6rem] top-24 h-48 w-48 rounded-full bg-[#ffe6d2]/10 blur-3xl" />
        <div className="absolute bottom-16 right-[-5rem] h-56 w-56 rounded-full bg-[#ffd3a2]/18 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-[0_8px_24px_rgba(20,8,7,0.22)]">
            Made for campus move-ins and move-outs
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-white select-none sm:text-5xl lg:text-6xl">
            Welcome to{" "}
            <span className="text-[rgb(var(--brand-accent))]">Uni</span>
            <span className="text-[rgb(var(--brand-primary))]">Market</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 select-none sm:text-lg">
            Find textbooks, furniture, tech, and last-minute essentials from
            students nearby without the usual marketplace noise.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-white/90">
            <span className="rounded-full border border-white/25 bg-[#fff6ef]/14 px-4 py-2 shadow-[0_8px_20px_rgba(20,8,7,0.18)]">
              Textbooks
            </span>
            <span className="rounded-full border border-white/25 bg-[#fff6ef]/14 px-4 py-2 shadow-[0_8px_20px_rgba(20,8,7,0.18)]">
              Furniture
            </span>
            <span className="rounded-full border border-white/25 bg-[#fff6ef]/14 px-4 py-2 shadow-[0_8px_20px_rgba(20,8,7,0.18)]">
              Electronics
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#listings"
              className="flex items-center gap-2 rounded-full bg-[rgb(var(--brand-primary))] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(20,8,7,0.22)] transition hover:brightness-95 active:scale-95"
            >
              Browse listings
              <span aria-hidden="true" className="text-base leading-none">
                →
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-full bg-[rgb(var(--brand-accent))] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(232,140,65,0.28)] transition hover:brightness-95 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Sell an item
            </button>
          </div>
        </div>
      </section>

      {/* ── Listings ──────────────────────────────────────────────────────── */}
      <section id="listings" className="w-full bg-[#f6f0ea] px-2 pb-28 pt-20 sm:px-3">
        <div className="mx-auto flex w-full max-w-[calc(100vw-1rem)] flex-col gap-10">
          <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-5 py-6 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8 sm:py-7">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex-1 sm:max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                    Featured Listings
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#2a1714]">
                    Latest listings
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  <div className="rounded-full bg-[#f1e4dc] px-4 py-2 text-sm font-medium text-[#855246]">
                    {loadingListings
                      ? "Checking marketplace…"
                      : `${listings.length} active listing${listings.length === 1 ? "" : "s"}`}
                  </div>
                </div>
              </div>

              <p className="text-sm leading-6 text-[#745f59] sm:text-base">
                New posts land here first. Sort what you see, save what you like, and message sellers when something stands out.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loadingListings && (
              <p className="col-span-full text-center text-sm text-gray-500">
                Loading listings…
              </p>
            )}

            {!loadingListings && listingsError && (
              <p className="col-span-full mx-auto max-w-xl rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.10)] px-5 py-4 text-center text-sm text-[rgb(var(--brand-primary))]">
                Failed to load listings: {listingsError}
              </p>
            )}

            {!loadingListings && !listingsError && listings.length === 0 && (
              <p className="col-span-full mx-auto max-w-xl rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-5 py-5 text-center text-sm leading-6 text-[#705f5a]">
                {hiddenOwnListingsCount > 0
                  ? "No listings from other sellers yet. Your own items are available in My listings."
                  : "No listings yet — be the first to post one!"}
              </p>
            )}

            {!loadingListings &&
              !listingsError &&
              listings.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  location={item.location}
                  price={`$${item.price}`}
                  image={item.image}
                  initialLiked={savedIds.has(item.id)}
                />
              ))}
          </div>
        </div>
      </section>

      {showCreate && (
        <ListingFormModal
          onClose={() => setShowCreate(false)}
          onSaved={(newListing) => {
            setShowCreate(false);
            if (newListing.status === "available") {
              setListings((prev) => [toViewModel(newListing), ...prev]);
            }
          }}
        />
      )}
    </main>
  );
}

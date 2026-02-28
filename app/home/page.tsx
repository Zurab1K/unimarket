"use client";

import ListingCard from "@/components/ListingCard";
import SortDropdown, { SortOption } from "@/components/SortDropdown";
import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchListings, type ListingRecord } from "@/lib/supabaseData";

type ListingCardViewModel = {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  date: number;
};

function formatListingLocation(listing: ListingRecord) {
  const parts = [listing.location, formatRelativeAge(listing.createdAt)].filter(Boolean);
  return parts.join(" • ") || "Campus listing";
}

function formatRelativeAge(createdAt: string) {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "";

  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (diffMinutes < 1440) {
    const hours = Math.round(diffMinutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(diffMinutes / 1440);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toListingCardModel(listing: ListingRecord): ListingCardViewModel {
  return {
    id: listing.id,
    title: listing.title,
    location: formatListingLocation(listing),
    price: listing.price,
    image: listing.images[0] ?? "/placeholder-avatar-picture.jpg",
    date: Math.max(1, Math.round((Date.now() - Date.parse(listing.createdAt || "")) / 60000)) || Number.MAX_SAFE_INTEGER,
  };
}

export default function MarketplaceHome() {
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [listings, setListings] = useState<ListingCardViewModel[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const ready = useAuthGuard();

  useEffect(() => {
    let active = true;

    async function loadListings() {
      setLoadingListings(true);
      const result = await fetchListings();

      if (!active) return;

      if (result.error) {
        setListingsError(result.error.message);
        setListings([]);
        setLoadingListings(false);
        return;
      }

      setListings(result.data.map(toListingCardModel));
      setListingsError(null);
      setLoadingListings(false);
    }

    loadListings();

    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === "latest") return a.date - b.date; // smaller minutes = newer
    if (sortBy === "oldest") return b.date - a.date;
    if (sortBy === "priceLow") return a.price - b.price;
    if (sortBy === "priceHigh") return b.price - a.price;
    return 0;
  });

  return (
    <main className="min-h-screen w-full snap-y snap-proximity">
      <section
        className="relative flex min-h-screen snap-start items-center justify-center overflow-hidden bg-gradient-to-br from-[#4a1716] via-[#7a2622] to-[#b44635] px-4 py-16 animate-gradientShift bg-[length:200%_200%]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,244,229,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(255,198,141,0.2),_transparent_30%)]" />
        <div className="absolute left-[-6rem] top-24 h-48 w-48 rounded-full bg-[#ffe6d2]/10 blur-3xl" />
        <div className="absolute bottom-16 right-[-5rem] h-56 w-56 rounded-full bg-[#ffd3a2]/20 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
            Student Marketplace
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight text-white select-none sm:text-5xl lg:text-6xl">
            Welcome to UniMarket
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 select-none sm:text-lg">
            Buy, sell, and trade dorm essentials, textbooks, and everyday finds with your campus
            community.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-white/85">
            <span className="rounded-full border border-white/20 bg-[#fff6ef]/12 px-4 py-2">Campus-only community</span>
            <span className="rounded-full border border-white/20 bg-[#fff6ef]/12 px-4 py-2">Quick meetups</span>
            <span className="rounded-full border border-white/20 bg-[#fff6ef]/12 px-4 py-2">Student-friendly pricing</span>
          </div>

          <div className="mt-8 flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-[#f3dacd]/20 bg-[#fffaf7] shadow-[0_16px_45px_rgba(25,10,8,0.24)] focus-within:ring-2 focus-within:ring-[#fff1e4]/70">
            <input
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[#2a1714] outline-none placeholder:text-[#8a736b]"
              type="text"
              placeholder="Search textbooks, furniture, electronics..."
            />
            <button
              aria-label="Search"
              className="m-1 rounded-full bg-[#f0b177] px-5 py-2.5 text-[#2a1714] transition hover:bg-[#e89a54] active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m1.6-4.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section
        className="min-h-screen w-full snap-start bg-[#f6f0ea] px-4 pb-28 pt-20"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-5 py-6 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b15b46]">
                  Featured Listings
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[#2a1714]">Fresh finds from your campus</h2>
                <p className="mt-3 text-sm leading-6 text-[#745f59] sm:text-base">
                  Browse the newest listings students have posted nearby, then sort by what matters most
                  to you.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <div className="rounded-full bg-[#f1e4dc] px-4 py-2 text-sm font-medium text-[#855246]">
                  {loadingListings ? "Checking marketplace..." : `${sortedListings.length} active listing${sortedListings.length === 1 ? "" : "s"}`}
                </div>
                <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loadingListings ? (
              <p className="col-span-full text-center text-sm text-gray-500">Loading listings...</p>
            ) : null}

            {!loadingListings && listingsError ? (
              <p className="col-span-full mx-auto max-w-xl rounded-2xl border border-rose-200 bg-[#fff5f4] px-5 py-4 text-center text-sm text-rose-700">
                Failed to load listings from Supabase: {listingsError}
              </p>
            ) : null}

            {!loadingListings && !listingsError && sortedListings.length === 0 ? (
              <p className="col-span-full mx-auto max-w-xl rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-5 py-5 text-center text-sm leading-6 text-[#705f5a]">
                No listings are available yet. New rows in `listings` will show up here automatically.
              </p>
            ) : null}

            {!loadingListings &&
              !listingsError &&
              sortedListings.map((item) => (
                <ListingCard
                  key={item.id}
                  title={item.title}
                  location={item.location}
                  price={`$${item.price}`}
                  image={item.image}
                />
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}

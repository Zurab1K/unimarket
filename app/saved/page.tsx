"use client";

import { useEffect, useState } from "react";
import { DEFAULT_IMAGE_SRC, normalizeImageList } from "@/lib/imageSources";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { supabase } from "@/lib/supabaseClient";
import { type ListingRecord } from "@/lib/supabaseData";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";

type SavedListing = ListingRecord & { savedAt: string };
type SavedListingEmbed = {
  id: number;
  seller_id: string;
  title: string;
  description?: string | null;
  price: number | string;
  category: string;
  condition?: string | null;
  status?: string | null;
  images?: unknown;
  location?: string | null;
  is_negotiable?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SavedListingRow = {
  created_at: string;
  listings: SavedListingEmbed | SavedListingEmbed[] | null;
};

export default function SavedPage() {
  const ready = useAuthGuard();
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("saved_listings")
        .select(
          `created_at,
           listings (
             id, seller_id, title, description, price, category,
             condition, status, images, location, is_negotiable,
             created_at, updated_at
           )`,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as SavedListingRow[];
      const normalized: SavedListing[] = rows.flatMap((row) => {
        const listing = Array.isArray(row.listings)
          ? row.listings[0] ?? null
          : row.listings;

        if (!listing) return [];

        return [
          {
            id: listing.id,
            sellerId: listing.seller_id,
            title: listing.title,
            description: listing.description ?? null,
            price:
              typeof listing.price === "number"
                ? listing.price
                : Number(listing.price),
            category: listing.category,
            condition: listing.condition ?? null,
            status: listing.status ?? "available",
            images: normalizeImageList(listing.images),
            location: listing.location ?? null,
            isNegotiable: listing.is_negotiable ?? false,
            createdAt: listing.created_at ?? "",
            updatedAt: listing.updated_at ?? "",
            savedAt: row.created_at,
          },
        ];
      });

      setListings(normalized);
      setError(null);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [ready]);

  function handleUnsave(id: number) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24 sm:pt-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        {/* Header */}
        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-7 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Your collection
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold text-[#2a1714]">
                Saved Listings
              </h1>
              <p className="mt-1 text-sm text-[#745f59]">
                Items you&apos;ve hearted across UniMarket.
              </p>
            </div>
            {!loading && !error && (
              <div className="rounded-full bg-[#f1e4dc] px-4 py-2 text-sm font-medium text-[#855246] self-start sm:self-auto">
                {listings.length} saved item{listings.length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>

        {/* States */}
        {loading && (
          <p className="text-center text-sm text-[#8a736b]">
            Loading saved listings…
          </p>
        )}

        {!loading && error && (
          <p className="rounded-2xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-5 py-4 text-sm text-[rgb(var(--brand-primary))]">
            {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-dashed border-[#e0cfc6] px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e4dc]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-[rgb(var(--brand-primary))]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#2a1714]">No saved listings yet</p>
              <p className="mt-1 text-sm text-[#745f59]">
                Tap the heart on any listing to save it here.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-[rgb(var(--brand-accent))] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97]"
            >
              Browse listings
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((item) => (
              <ListingCard
                key={item.id}
                id={item.id}
                title={item.title}
                location={
                  [item.location, item.category].filter(Boolean).join(" • ")
                }
                price={`$${item.price}`}
                image={item.images[0] ?? DEFAULT_IMAGE_SRC}
                initialLiked={true}
                onUnlike={() => handleUnsave(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

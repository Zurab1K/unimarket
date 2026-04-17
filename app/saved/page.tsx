"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { supabase } from "@/lib/supabaseClient";
import { type ListingRecord } from "@/lib/supabaseData";
import ListingCard from "@/components/ListingCard";
import Link from "next/link";

type SavedListing = ListingRecord & { savedAt: string };

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

      const normalized: SavedListing[] = (data ?? [])
        .filter((row: any) => row.listings)
        .map((row: any) => {
          const l = row.listings;
          return {
            id: l.id,
            sellerId: l.seller_id,
            title: l.title,
            description: l.description ?? null,
            price: typeof l.price === "number" ? l.price : Number(l.price),
            category: l.category,
            condition: l.condition ?? null,
            status: l.status ?? "available",
            images: Array.isArray(l.images)
              ? l.images.filter((i: unknown) => typeof i === "string")
              : [],
            location: l.location ?? null,
            isNegotiable: l.is_negotiable ?? false,
            createdAt: l.created_at ?? "",
            updatedAt: l.updated_at ?? "",
            savedAt: row.created_at,
          };
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
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        {/* Header */}
        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-7 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b15b46]">
                Your collection
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold text-[#2a1714]">
                Saved Listings
              </h1>
              <p className="mt-1 text-sm text-[#745f59]">
                Items you've hearted across UniMarket.
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
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-dashed border-[#e0cfc6] px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e4dc]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-[#b15b46]"
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
              className="rounded-full bg-[#b15b46] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#9a4c38] active:scale-[0.97]"
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
                image={item.images[0] ?? "/placeholder-avatar-picture.jpg"}
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
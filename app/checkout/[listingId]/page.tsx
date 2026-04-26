"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchListing, getProfileByUserId, type ListingRecord, type UserProfile } from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";
import FallbackImage from "@/components/FallbackImage";
import { DEFAULT_IMAGE_SRC } from "@/lib/imageSources";

export default function CheckoutReviewPage() {
  const ready = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = Number(params.listingId);

  const customPriceCents = searchParams.get("price") ? Number(searchParams.get("price")) : null;

  const [listing, setListing] = useState<ListingRecord | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !listingId) return;
    let active = true;

    async function load() {
      const [{ data: session }, listingResult] = await Promise.all([
        supabase.auth.getSession(),
        fetchListing(listingId),
      ]);

      if (!active) return;

      if (!session?.session) {
        router.push("/login");
        return;
      }

      setCurrentUserId(session.session.user.id);

      if (!listingResult.data) {
        setError("Listing not found.");
        setLoading(false);
        return;
      }

      setListing(listingResult.data);

      const sellerProfile = await getProfileByUserId(listingResult.data.sellerId);
      if (active) setSeller(sellerProfile);

      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [ready, listingId, router]);

  async function handlePay() {
    if (!listing || !currentUserId) return;
    setPaying(true);
    setError(null);

    try {
      const priceCents = customPriceCents ?? Math.round(listing.price * 100);
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          title: listing.title,
          priceCents,
          sellerId: listing.sellerId,
          buyerId: currentUserId,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Could not start checkout. Please try again.");
        setPaying(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0ea]">
        <p className="text-sm text-[#8a736b]">Loading…</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f0ea] px-4">
        <p className="text-sm text-[#8a736b]">{error ?? "Listing not found."}</p>
        <button onClick={() => router.back()} className="text-sm font-medium text-[rgb(var(--brand-primary))] underline">
          Go back
        </button>
      </main>
    );
  }

  const displayPrice = customPriceCents != null ? customPriceCents / 100 : listing.price;
  const isOfferPrice = customPriceCents != null && customPriceCents !== Math.round(listing.price * 100);
  const sellerName = seller?.full_name ?? seller?.username ?? "Seller";
  const image = listing.images[0] ?? DEFAULT_IMAGE_SRC;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#7a5a52] transition hover:text-[rgb(var(--brand-primary))]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_12px_30px_rgba(75,36,28,0.07)]">
          {/* Header */}
          <div className="border-b border-[#f0e7e0] px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
              Review your order
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#2a1714]">Checkout</h1>
          </div>

          {/* Item row */}
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#f0e7e0]">
              <FallbackImage
                src={image}
                fallbackSrc={DEFAULT_IMAGE_SRC}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-[#2a1714]">{listing.title}</p>
              {listing.category && (
                <p className="mt-0.5 text-xs text-[#8a736b]">{listing.category}</p>
              )}
              <p className="mt-1 text-xs text-[#8a736b]">
                Sold by <span className="font-medium text-[#53433d]">{sellerName}</span>
              </p>
            </div>
          </div>

          {/* Price summary */}
          <div className="mx-6 mb-5 rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-4 py-4">
            {isOfferPrice && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#8a736b]">Listed price</span>
                <span className="text-[#b8aea4] line-through">${listing.price.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#745f59]">{isOfferPrice ? "Agreed offer price" : "Price"}</span>
              <span className="font-semibold text-[#2a1714]">${displayPrice.toFixed(2)}</span>
            </div>
            <div className="my-3 border-t border-[#f0e7e0]" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#2a1714]">Total</span>
              <span className="text-lg font-bold text-[#2a1714]">${displayPrice.toFixed(2)}</span>
            </div>
            {isOfferPrice && (
              <p className="mt-2 text-xs text-emerald-600">
                You saved ${(listing.price - displayPrice).toFixed(2)} with your offer
              </p>
            )}
          </div>

          {/* Payment note */}
          <div className="mx-6 mb-5 flex items-center gap-2 rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-4 py-3 text-xs text-[#8a736b]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-[#a88a7e]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            You&apos;ll be taken to a secure Stripe payment page to enter your card details.
          </div>

          {error && (
            <p className="mx-6 mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* CTA */}
          <div className="flex flex-col gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="w-full rounded-full bg-[rgb(var(--brand-primary))] py-4 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Redirecting to payment…
                </span>
              ) : (
                `Pay $${displayPrice.toFixed(2)} securely`
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={paying}
              className="w-full rounded-full border border-[#e0cfc6] bg-transparent py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

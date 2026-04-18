"use client";

import { useEffect, useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchMyListings, type ListingRecord } from "@/lib/supabaseData";
import MyListingCard from "@/components/MyListingCard";
import ListingFormModal from "@/components/ListingFormModal";

export default function MyListingsPage() {
  const ready = useAuthGuard();
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function load() {
      setLoading(true);
      const result = await fetchMyListings();
      if (!active) return;

      if (result.error) {
        setError(result.error.message);
      } else {
        setListings(result.data);
        setError(null);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [ready]);

  if (!ready) return null;

  function handleCreated(listing: ListingRecord) {
    setShowCreate(false);
    setListings((prev) => [listing, ...prev]);
  }

  function handleUpdated(updated: ListingRecord) {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  function handleDeleted(id: number) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  const totalValue = listings
    .filter((l) => l.status !== "sold")
    .reduce((s, l) => s + l.price, 0);

  const byStatus = (status: string) =>
    listings.filter((l) => l.status === status).length;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-20">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        {/* Header */}
        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-7 shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b15b46]">
                Seller Dashboard
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold text-[#2a1714]">
                My Listings
              </h1>
              <p className="mt-1 text-sm text-[#745f59]">
                Manage everything you&apos;ve posted on UniMarket.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 self-start rounded-full bg-[#b15b46] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#9a4c38] active:scale-[0.97] sm:self-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New listing
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {!loading && !error && (
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Total" value={listings.length} />
            <Stat label="Available" value={byStatus("available")} />
            <Stat label="Pending" value={byStatus("pending")} />
            <Stat label="Active value" value={`$${totalValue.toFixed(0)}`} />
          </div>
        )}

        {loading && (
          <p className="text-center text-sm text-[#8a736b]">
            Loading your listings…
          </p>
        )}

        {!loading && error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </p>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-dashed border-[#e0cfc6] px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f1e4dc]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#b15b46]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#2a1714]">No listings yet</p>
              <p className="mt-1 text-sm text-[#745f59]">
                Click &quot;New listing&quot; above to post your first item.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <MyListingCard
                key={listing.id}
                listing={listing}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <ListingFormModal
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-3 py-4 text-center shadow-sm">
      <p className="text-lg font-bold text-[#2a1714]">{value}</p>
      <p className="text-[11px] text-[#8a736b]">{label}</p>
    </div>
  );
}

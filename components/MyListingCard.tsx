"use client";

import { useState } from "react";
import FallbackImage from "@/components/FallbackImage";
import { DEFAULT_IMAGE_SRC } from "@/lib/imageSources";
import type { ListingRecord } from "@/lib/supabaseData";
import { deleteListing } from "@/lib/supabaseData";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import ListingFormModal from "@/components/ListingFormModal";

interface MyListingCardProps {
  listing: ListingRecord;
  onUpdated: (listing: ListingRecord) => void;
  onDeleted: (id: number) => void;
}

const STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  sold: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function MyListingCard({
  listing,
  onUpdated,
  onDeleted,
}: MyListingCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const thumb = listing.images[0] ?? DEFAULT_IMAGE_SRC;
  const statusStyle =
    STATUS_STYLES[listing.status] ?? STATUS_STYLES["available"];

  async function handleDelete() {
    const result = await deleteListing(listing.id);
    if (result.error) throw new Error(result.error.message);
    onDeleted(listing.id);
  }

  return (
    <>
      <div className="group flex gap-4 overflow-hidden rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-4 shadow-[0_6px_20px_rgba(63,27,21,0.06)] transition hover:shadow-[0_10px_28px_rgba(63,27,21,0.1)]">
        {/* Thumbnail */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[#eadccf]">
          <FallbackImage
            src={thumb}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[#2a1714]">
                {listing.title}
              </p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
              >
                {listing.status}
              </span>
              {listing.isNegotiable && (
                <span className="rounded-full border border-[#e0cfc6] bg-[#faf0ea] px-2 py-0.5 text-[10px] font-medium text-[#8a5a45]">
                  negotiable
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#8a736b]">
              {[listing.category, listing.condition, listing.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <p className="text-base font-bold text-[rgb(var(--brand-primary))]">
            ${listing.price.toFixed(2)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 flex-col items-end justify-between">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e0cfc6] bg-[#faf5f2] text-[#6d4037] transition hover:bg-[#f1e4dc]"
            aria-label="Edit listing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] text-[rgb(var(--brand-primary))] transition hover:bg-[rgba(var(--brand-accent),0.18)]"
            aria-label="Delete listing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {showEdit && (
        <ListingFormModal
          listing={listing}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setShowEdit(false);
            onUpdated(updated);
          }}
        />
      )}

      {showDelete && (
        <DeleteConfirmModal
          title={listing.title}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

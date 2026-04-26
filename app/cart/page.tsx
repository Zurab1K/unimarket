"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FallbackImage from "@/components/FallbackImage";
import { readCart, removeCartItem, type CartItem } from "@/lib/cart";
import { DEFAULT_IMAGE_SRC } from "@/lib/imageSources";
import LocationMap from "@/components/LocationMap";
import {
  DEFAULT_MAP_CENTER,
  formatLocationText,
  getLocationDisplayLabel,
  parseLocationText,
} from "@/lib/location";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [meetupLabel, setMeetupLabel] = useState("Campus meetup point");
  const [meetupPoint, setMeetupPoint] = useState<[number, number] | null>(null);

  useEffect(() => {
    setItems(readCart());
    const cached = window.localStorage.getItem("unimarket-final-meetup");
    if (cached) {
      const parsed = parseLocationText(cached);
      setMeetupLabel(parsed.label || "Campus meetup point");
      if (parsed.lat !== null && parsed.lng !== null) {
        setMeetupPoint([parsed.lat, parsed.lng]);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const text = formatLocationText(meetupLabel, meetupPoint?.[0], meetupPoint?.[1]);
    window.localStorage.setItem("unimarket-final-meetup", text);
  }, [meetupLabel, meetupPoint]);

  function handleRemove(id: number) {
    setItems(removeCartItem(id));
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-7 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Your Cart
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold text-[#2a1714]">
                Review your picks
              </h1>
              <p className="mt-1 text-sm text-[#745f59]">
                Items you added from listing pages live here for now.
              </p>
            </div>
            <div className="rounded-full bg-[#f1e4dc] px-4 py-2 text-sm font-medium text-[#855246]">
              {items.length} item{items.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-[#8a736b]">Loading cart…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-dashed border-[#e0cfc6] px-6 py-16 text-center">
            <div>
              <p className="font-semibold text-[#2a1714]">Your cart is empty</p>
              <p className="mt-1 text-sm text-[#745f59]">
                Add an item from a listing page to see it here.
              </p>
            </div>
            <Link
              href="/home"
              className="rounded-full bg-[rgb(var(--brand-accent))] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97]"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[1.6rem] border border-[#eadccf] bg-[#fffaf6] p-4 shadow-[0_10px_24px_rgba(75,36,28,0.05)] sm:flex-row sm:items-center"
                >
                  <div className="relative h-28 w-full overflow-hidden rounded-[1.25rem] bg-[#f7efe9] sm:w-36">
                    <FallbackImage
                      src={item.image ?? DEFAULT_IMAGE_SRC}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="144px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-[#2a1714]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-[#745f59]">
                      {getLocationDisplayLabel(item.location)}
                    </p>
                    <p className="mt-3 text-base font-semibold text-[rgb(var(--brand-primary))]">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <span className="rounded-full bg-[#f1e4dc] px-3 py-1.5 text-xs font-medium text-[#855246]">
                      Qty {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-4 py-2 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-[1.8rem] border border-[#eadccf] bg-[#fffaf6] p-6 shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Summary
              </p>
              <div className="mt-5 flex items-center justify-between text-sm text-[#745f59]">
                <span>Subtotal</span>
                <span className="text-lg font-semibold text-[#2a1714]">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#745f59]">
                Confirm the final pickup point before you reach out to each seller.
              </p>
              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#8a736b]">
                  Final meetup note
                </label>
                <input
                  type="text"
                  value={meetupLabel}
                  onChange={(event) => setMeetupLabel(event.target.value)}
                  className="w-full rounded-xl border border-[#e0cfc6] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4">
                <LocationMap
                  center={meetupPoint ?? DEFAULT_MAP_CENTER}
                  marker={meetupPoint}
                  onPick={(lat, lng) => setMeetupPoint([lat, lng])}
                />
                <p className="mt-2 text-xs text-[#8a736b]">
                  Click the map to lock a meetup point for reservation planning.
                </p>
              </div>
              <Link
                href="/home"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[rgb(var(--brand-accent))] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97]"
              >
                Continue browsing
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

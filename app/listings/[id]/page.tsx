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
  getMyOfferThread,
  getOffersForListing,
  submitOffer,
  acceptOffer,
  rejectOffer,
  withdrawOffer,
  reserveItem,
  confirmPurchase,
  cancelReservation,
  markAsSold,
  cancelListing,
  relistItem,
  getTransactionForListing,
  type ListingRecord,
  type UserProfile,
  type Offer,
  type OfferWithBuyer,
  type Transaction,
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
  reserved: "bg-blue-50 text-blue-700 border-blue-200",
  sold: "bg-slate-100 text-slate-500 border-slate-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  pending: "Pending",
  reserved: "Reserved",
  sold: "Sold",
  cancelled: "Cancelled",
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
  const [buyLoading, setBuyLoading] = useState(false);

  // Transaction state
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Offer state
  const [offerThread, setOfferThread] = useState<Offer[]>([]);
  const [listingOffers, setListingOffers] = useState<OfferWithBuyer[]>([]);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [counterAmounts, setCounterAmounts] = useState<Record<number, string>>({});

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

      if (listingResult.data && user) {
        const l = listingResult.data;
        const [txResult, offersOrThread] = await Promise.all([
          getTransactionForListing(l.id),
          user.id !== l.sellerId
            ? getMyOfferThread(l.id)
            : getOffersForListing(l.id),
        ]);
        if (!active) return;
        if (txResult.data) setTransaction(txResult.data);
        if (user.id !== l.sellerId) {
          setOfferThread(offersOrThread.data as Offer[]);
        } else {
          setListingOffers(offersOrThread.data as OfferWithBuyer[]);
        }
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

  async function handleBuyNow(customPriceCents?: number) {
    if (!listing || !currentUserId) return;
    setBuyLoading(true);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          title: listing.title,
          priceCents: customPriceCents ?? Math.round(listing.price * 100),
          sellerId: listing.sellerId,
          buyerId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setBuyLoading(false);
      }
    } catch {
      setBuyLoading(false);
    }
  }

  async function refreshAll() {
    if (!listing || !currentUserId) return;
    const [listingResult, txResult] = await Promise.all([
      fetchListing(listing.id),
      getTransactionForListing(listing.id),
    ]);
    if (listingResult.data) setListing(listingResult.data);
    setTransaction(txResult.data);
    if (currentUserId !== listing.sellerId) {
      const { data: thread } = await getMyOfferThread(listing.id);
      setOfferThread(thread);
    } else {
      const { data: offers } = await getOffersForListing(listing.id);
      setListingOffers(offers);
    }
  }

  async function handleSubmitOffer(parentId?: number) {
    if (!listing || !currentUserId) return;
    const parsed = parseFloat(offerAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setOfferError("Enter a valid amount.");
      return;
    }
    setOfferSubmitting(true);
    setOfferError(null);
    const { error } = await submitOffer({
      listingId: listing.id,
      buyerId: currentUserId,
      sellerId: listing.sellerId,
      amount: parsed,
      message: offerMessage.trim() || undefined,
      parentId,
    });
    setOfferSubmitting(false);
    if (error) {
      setOfferError(error.message);
    } else {
      setOfferAmount("");
      setOfferMessage("");
      setShowOfferForm(false);
      await refreshAll();
    }
  }

  async function handleSellerCounter(offer: OfferWithBuyer) {
    if (!listing || !currentUserId) return;
    const raw = counterAmounts[offer.id] ?? "";
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed <= 0) return;
    setOfferSubmitting(true);
    await submitOffer({
      listingId: listing.id,
      buyerId: offer.buyerId,
      sellerId: listing.sellerId,
      amount: parsed,
      parentId: offer.id,
    });
    setOfferSubmitting(false);
    setCounterAmounts((prev) => { const next = { ...prev }; delete next[offer.id]; return next; });
    await refreshAll();
  }

  async function handleAcceptOffer(offerId: number) {
    if (!listing) return;
    setOfferSubmitting(true);
    await acceptOffer(offerId, listing.id);
    setOfferSubmitting(false);
    await refreshAll();
  }

  async function handleRejectOffer(offerId: number) {
    setOfferSubmitting(true);
    await rejectOffer(offerId);
    setOfferSubmitting(false);
    await refreshAll();
  }

  async function handleWithdrawOffer(offerId: number) {
    if (!listing) return;
    setOfferSubmitting(true);
    await withdrawOffer(offerId, listing.id);
    setOfferSubmitting(false);
    await refreshAll();
  }

  async function handleReserveItem() {
    if (!listing) return;
    setTxSubmitting(true);
    const acceptedOffer = offerThread.find((o) => o.status === "accepted");
    await reserveItem({
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      buyerId: acceptedOffer?.buyerId ?? null,
      agreedAmount: acceptedOffer?.amount ?? undefined,
      offerId: acceptedOffer?.id ?? undefined,
      source: acceptedOffer ? "offer" : "direct",
    });
    setTxSubmitting(false);
    await refreshAll();
  }

  async function handleConfirmPurchase() {
    if (!transaction) return;
    setTxSubmitting(true);
    await confirmPurchase(transaction.id);
    setTxSubmitting(false);
    await refreshAll();
  }

  async function handleCancelReservation() {
    if (!transaction || !listing) return;
    setTxSubmitting(true);
    await cancelReservation(transaction.id, listing.id);
    setTxSubmitting(false);
    await refreshAll();
  }

  async function handleMarkAsSold() {
    if (!listing) return;
    setTxSubmitting(true);
    await markAsSold(listing.id, transaction?.id);
    setTxSubmitting(false);
    await refreshAll();
  }

  async function handleCancelListing() {
    if (!listing) return;
    setTxSubmitting(true);
    await cancelListing(listing.id);
    setTxSubmitting(false);
    await refreshAll();
  }

  async function handleRelistItem() {
    if (!listing) return;
    setTxSubmitting(true);
    await relistItem(listing.id);
    setTxSubmitting(false);
    await refreshAll();
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
                {STATUS_LABELS[listing.status] ?? listing.status}
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

            {cartNotice && (
              <p className="rounded-2xl border border-[rgba(var(--brand-accent),0.24)] bg-[rgba(var(--brand-accent),0.12)] px-4 py-3 text-sm font-medium text-[rgb(var(--brand-primary))]">
                {cartNotice}
              </p>
            )}

            {/* ── Buyer CTAs ── */}
            {!isOwner && (() => {
              const activeOffer = offerThread.length > 0 ? offerThread[offerThread.length - 1] : null;
              const acceptedOffer = offerThread.find((o) => o.status === "accepted");

              if (listing.status === "sold" || listing.status === "cancelled") {
                return (
                  <p className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-4 py-3 text-center text-sm font-medium text-[#8a736b]">
                    {listing.status === "sold" ? "This item has been sold." : "This listing has been cancelled."}
                  </p>
                );
              }

              if (listing.status === "reserved") {
                if (acceptedOffer) {
                  return (
                    <button
                      type="button"
                      onClick={() => handleBuyNow(Math.round(acceptedOffer.amount * 100))}
                      disabled={buyLoading}
                      className="w-full rounded-full bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {buyLoading ? "Redirecting…" : `Complete Purchase — $${acceptedOffer.amount.toFixed(2)}`}
                    </button>
                  );
                }
                return (
                  <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">
                    This item is reserved for another buyer.
                  </p>
                );
              }

              return (
                <div className="flex flex-col gap-4">
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
                      onClick={() => handleBuyNow()}
                      disabled={buyLoading}
                      className="flex-1 rounded-full bg-[rgb(var(--brand-primary))] py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {buyLoading ? "Redirecting…" : "Buy Now"}
                    </button>
                  </div>

                  <BuyerOfferPanel
                    listing={listing}
                    currentUserId={currentUserId}
                    activeOffer={activeOffer}
                    showOfferForm={showOfferForm}
                    offerAmount={offerAmount}
                    offerMessage={offerMessage}
                    offerSubmitting={offerSubmitting}
                    offerError={offerError}
                    onToggleForm={() => { setShowOfferForm((v) => !v); setOfferError(null); }}
                    onAmountChange={setOfferAmount}
                    onMessageChange={setOfferMessage}
                    onSubmit={() => handleSubmitOffer()}
                    onWithdraw={(id) => handleWithdrawOffer(id)}
                    onAcceptCounter={(o) => {
                      setOfferAmount(String(o.amount));
                      handleSubmitOffer(o.id);
                    }}
                    onRejectCounter={(id) => handleRejectOffer(id)}
                    onCounter={(o) => {
                      setOfferAmount(String(o.amount));
                      setShowOfferForm(true);
                    }}
                  />

                  <BuyerTransactionStatus
                    transaction={transaction}
                    currentUserId={currentUserId}
                    submitting={txSubmitting}
                    onConfirm={handleConfirmPurchase}
                    onCancel={handleCancelReservation}
                  />
                </div>
              );
            })()}

            {/* Owner actions */}
            {isOwner && (
              <div className="flex flex-col gap-4">
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-5 py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z" />
                  </svg>
                  Edit in My Listings
                </Link>

                <SellerActionsPanel
                  listing={listing}
                  transaction={transaction}
                  submitting={txSubmitting}
                  onReserve={handleReserveItem}
                  onMarkSold={handleMarkAsSold}
                  onCancelReservation={handleCancelReservation}
                  onCancelListing={handleCancelListing}
                  onRelist={handleRelistItem}
                />

                <SellerOffersPanel
                  offers={listingOffers}
                  counterAmounts={counterAmounts}
                  submitting={offerSubmitting}
                  onAccept={(id) => handleAcceptOffer(id)}
                  onReject={(id) => handleRejectOffer(id)}
                  onCounterAmountChange={(id, val) => {
                    if (val === "") {
                      setCounterAmounts((prev) => {
                        const next = { ...prev };
                        delete next[id];
                        return next;
                      });
                    } else {
                      setCounterAmounts((prev) => ({ ...prev, [id]: val }));
                    }
                  }}
                  onSubmitCounter={(offer) => handleSellerCounter(offer)}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

// ─── SellerActionsPanel ───────────────────────────────────────────────────────

function SellerActionsPanel({
  listing,
  transaction,
  submitting,
  onReserve,
  onMarkSold,
  onCancelReservation,
  onCancelListing,
  onRelist,
}: {
  listing: ListingRecord;
  transaction: Transaction | null;
  submitting: boolean;
  onReserve: () => void;
  onMarkSold: () => void;
  onCancelReservation: () => void;
  onCancelListing: () => void;
  onRelist: () => void;
}) {
  const txStatusMap: Record<string, { label: string; className: string }> = {
    reserved:  { label: "Reserved",  className: "bg-blue-50 text-blue-700 border-blue-200" },
    confirmed: { label: "Buyer confirmed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    completed: { label: "Completed", className: "bg-slate-100 text-slate-600 border-slate-200" },
    cancelled: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-200" },
  };

  return (
    <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
        Listing Actions
      </p>

      {transaction && transaction.status !== "cancelled" && (
        <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${txStatusMap[transaction.status]?.className ?? ""}`}>
          <span className="font-medium">Transaction:</span>
          <span>{txStatusMap[transaction.status]?.label ?? transaction.status}</span>
          {transaction.agreedAmount && (
            <span className="ml-auto font-bold">${transaction.agreedAmount.toFixed(2)}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {listing.status === "available" && (
          <>
            <ActionBtn onClick={onReserve} disabled={submitting} variant="secondary">
              Reserve Item
            </ActionBtn>
            <ActionBtn onClick={onMarkSold} disabled={submitting} variant="secondary">
              Mark as Sold
            </ActionBtn>
            <ActionBtn onClick={onCancelListing} disabled={submitting} variant="danger">
              Cancel Listing
            </ActionBtn>
          </>
        )}

        {listing.status === "reserved" && (
          <>
            <ActionBtn onClick={onMarkSold} disabled={submitting} variant="primary">
              Confirm Sale / Mark Sold
            </ActionBtn>
            <ActionBtn onClick={onCancelReservation} disabled={submitting} variant="danger">
              Cancel Reservation
            </ActionBtn>
          </>
        )}

        {listing.status === "cancelled" && (
          <ActionBtn onClick={onRelist} disabled={submitting} variant="secondary">
            Relist Item
          </ActionBtn>
        )}
      </div>
    </div>
  );
}

// ─── BuyerTransactionStatus ───────────────────────────────────────────────────

function BuyerTransactionStatus({
  transaction,
  currentUserId,
  submitting,
  onConfirm,
  onCancel,
}: {
  transaction: Transaction | null;
  currentUserId: string | null;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!transaction || !currentUserId) return null;
  if (transaction.buyerId !== currentUserId) return null;
  if (transaction.status === "cancelled") return null;

  return (
    <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
        Your Transaction
      </p>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-xl border border-[#ecddd5] bg-white px-3 py-2">
          <span className="text-[#745f59]">Status</span>
          <span className="font-semibold capitalize text-[#2a1714]">{transaction.status}</span>
        </div>
        {transaction.agreedAmount && (
          <div className="flex items-center justify-between rounded-xl border border-[#ecddd5] bg-white px-3 py-2">
            <span className="text-[#745f59]">Agreed price</span>
            <span className="font-bold text-[#2a1714]">${transaction.agreedAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {transaction.status === "reserved" && (
        <div className="mt-3 flex gap-2">
          <ActionBtn onClick={onConfirm} disabled={submitting} variant="primary">
            Confirm Purchase
          </ActionBtn>
          <ActionBtn onClick={onCancel} disabled={submitting} variant="danger">
            Cancel
          </ActionBtn>
        </div>
      )}

      {transaction.status === "confirmed" && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Purchase confirmed! Complete payment to finalize.
        </p>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: "bg-[rgb(var(--brand-accent))] text-white hover:brightness-95",
    secondary: "border border-[#e0cfc6] bg-[#faf5f2] text-[#6d4037] hover:bg-[#f1e4dc]",
    danger: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

// ─── BuyerOfferPanel ─────────────────────────────────────────────────────────

function BuyerOfferPanel({
  listing,
  currentUserId,
  activeOffer,
  showOfferForm,
  offerAmount,
  offerMessage,
  offerSubmitting,
  offerError,
  onToggleForm,
  onAmountChange,
  onMessageChange,
  onSubmit,
  onWithdraw,
  onAcceptCounter,
  onRejectCounter,
  onCounter,
}: {
  listing: ListingRecord;
  currentUserId: string | null;
  activeOffer: Offer | null;
  showOfferForm: boolean;
  offerAmount: string;
  offerMessage: string;
  offerSubmitting: boolean;
  offerError: string | null;
  onToggleForm: () => void;
  onAmountChange: (v: string) => void;
  onMessageChange: (v: string) => void;
  onSubmit: () => void;
  onWithdraw: (id: number) => void;
  onAcceptCounter: (o: Offer) => void;
  onRejectCounter: (id: number) => void;
  onCounter: (o: Offer) => void;
}) {
  if (!currentUserId) return null;

  const hasPendingByBuyer =
    activeOffer?.status === "pending" && activeOffer.madeBy === currentUserId;
  const hasCounterBySeller =
    activeOffer?.status === "pending" && activeOffer.madeBy !== currentUserId;
  const isAccepted = activeOffer?.status === "accepted";
  const isRejected = activeOffer?.status === "rejected";
  const isWithdrawn = activeOffer?.status === "withdrawn";
  const hasActiveThread = activeOffer && !isWithdrawn && !isRejected;

  return (
    <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
        Make an Offer
      </p>

      {/* Seller countered — buyer's turn */}
      {hasCounterBySeller && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
            <p className="font-medium text-blue-800">
              Seller countered with <span className="font-bold">${activeOffer.amount.toFixed(2)}</span>
            </p>
            {activeOffer.message && (
              <p className="mt-1 text-blue-700">&ldquo;{activeOffer.message}&rdquo;</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={offerSubmitting}
              onClick={() => onAcceptCounter(activeOffer)}
              className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              Accept ${activeOffer.amount.toFixed(2)}
            </button>
            <button
              type="button"
              disabled={offerSubmitting}
              onClick={() => onRejectCounter(activeOffer.id)}
              className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onCounter(activeOffer)}
              className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
            >
              Counter
            </button>
          </div>
        </div>
      )}

      {/* Buyer's pending offer */}
      {hasPendingByBuyer && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-medium text-amber-800">
              Your offer of <span className="font-bold">${activeOffer.amount.toFixed(2)}</span> is awaiting the seller&apos;s response.
            </p>
            {activeOffer.message && (
              <p className="mt-1 text-amber-700">&ldquo;{activeOffer.message}&rdquo;</p>
            )}
          </div>
          <button
            type="button"
            disabled={offerSubmitting}
            onClick={() => onWithdraw(activeOffer.id)}
            className="w-full rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] disabled:opacity-50"
          >
            Withdraw Offer
          </button>
        </div>
      )}

      {/* Accepted — waiting to complete purchase */}
      {isAccepted && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Your offer was accepted! Use &ldquo;Complete Purchase&rdquo; to pay.
        </p>
      )}

      {/* Rejected / withdrawn — can make new offer */}
      {(isRejected || isWithdrawn || !hasActiveThread) && !isAccepted && (
        <>
          {(isRejected || isWithdrawn) && (
            <p className="mt-2 text-xs text-[#8a736b]">
              {isRejected ? "Your previous offer was declined." : "Your previous offer was withdrawn."}
              {" "}You can submit a new one.
            </p>
          )}

          {!showOfferForm && (
            <button
              type="button"
              onClick={onToggleForm}
              className="mt-3 w-full rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
            >
              Make an Offer
            </button>
          )}

          {showOfferForm && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#e8dcd3] bg-white px-4 py-2.5">
                <span className="text-sm font-medium text-[#7a5a52]">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={`Max ${listing.price.toFixed(2)}`}
                  value={offerAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#2a1714] outline-none placeholder:text-[#bba89e]"
                />
              </div>
              <textarea
                placeholder="Optional message to seller…"
                value={offerMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-[#e8dcd3] bg-white px-4 py-2.5 text-sm text-[#2a1714] outline-none placeholder:text-[#bba89e]"
              />
              {offerError && (
                <p className="text-xs text-red-600">{offerError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={offerSubmitting}
                  onClick={onSubmit}
                  className="flex-1 rounded-full bg-[rgb(var(--brand-accent))] py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                >
                  {offerSubmitting ? "Submitting…" : "Submit Offer"}
                </button>
                <button
                  type="button"
                  onClick={onToggleForm}
                  className="rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-4 py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SellerOffersPanel ────────────────────────────────────────────────────────

function SellerOffersPanel({
  offers,
  counterAmounts,
  submitting,
  onAccept,
  onReject,
  onCounterAmountChange,
  onSubmitCounter,
}: {
  offers: OfferWithBuyer[];
  counterAmounts: Record<number, string>;
  submitting: boolean;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onCounterAmountChange: (id: number, val: string) => void;
  onSubmitCounter: (offer: OfferWithBuyer) => void;
}) {
  if (offers.length === 0) return null;

  const pendingCount = offers.filter((o) => o.status === "pending").length;

  return (
    <div className="rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
          Offers Received
        </p>
        {pendingCount > 0 && (
          <span className="rounded-full bg-[rgb(var(--brand-accent))] px-2.5 py-0.5 text-xs font-semibold text-white">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="mt-3 space-y-3">
        {offers.map((offer) => {
          const isCounter = counterAmounts[offer.id] !== undefined;
          return (
            <div
              key={offer.id}
              className="rounded-xl border border-[#ecddd5] bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#2a1714]">
                    @{offer.buyerUsername}
                    <span className="ml-2 font-bold text-[rgb(var(--brand-primary))]">
                      ${offer.amount.toFixed(2)}
                    </span>
                  </p>
                  {offer.message && (
                    <p className="mt-1 text-xs text-[#745f59]">&ldquo;{offer.message}&rdquo;</p>
                  )}
                </div>
                <OfferStatusBadge status={offer.status} />
              </div>

              {offer.status === "pending" && (
                <div className="mt-3 space-y-2">
                  {!isCounter ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => onAccept(offer.id)}
                        className="flex-1 rounded-full bg-emerald-600 py-2 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => onReject(offer.id)}
                        className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-2 text-xs font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onCounterAmountChange(offer.id, String(offer.amount))}
                        className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-2 text-xs font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
                      >
                        Counter
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex flex-1 items-center gap-1 rounded-xl border border-[#e8dcd3] bg-white px-3 py-1.5">
                        <span className="text-xs text-[#7a5a52]">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={counterAmounts[offer.id]}
                          onChange={(e) => onCounterAmountChange(offer.id, e.target.value)}
                          className="flex-1 bg-transparent text-xs text-[#2a1714] outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => onSubmitCounter(offer)}
                        className="rounded-full bg-[rgb(var(--brand-accent))] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        onClick={() => onCounterAmountChange(offer.id, "")}
                        className="rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-3 py-1.5 text-xs font-medium text-[#6d4037] transition hover:bg-[#f1e4dc]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OfferStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200" },
    accepted:  { label: "Accepted",  className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected:  { label: "Rejected",  className: "bg-red-50 text-red-500 border-red-200" },
    countered: { label: "Countered", className: "bg-blue-50 text-blue-700 border-blue-200" },
    withdrawn: { label: "Withdrawn", className: "bg-slate-100 text-slate-500 border-slate-200" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
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

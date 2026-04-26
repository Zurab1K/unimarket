"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { getMyTransactions, type TransactionWithCounterparty } from "@/lib/supabaseData";
import { readDemoTransactions } from "@/lib/demoTransactions";

const STATUS_STYLE: Record<string, string> = {
  reserved:  "bg-blue-50 text-blue-700 border-blue-200",
  confirmed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  reserved:  "Reserved",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const SOURCE_LABEL: Record<string, string> = {
  direct: "Direct",
  offer:  "Via Offer",
  stripe: "Demo Checkout",
};

type Tab = "all" | "buying" | "selling";

export default function TransactionsPage() {
  const ready = useAuthGuard();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionWithCounterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    if (!ready) return;
    let active = true;

    async function load() {
      setLoading(true);
      const { data } = await getMyTransactions();
      const existingListingIds = new Set(data.map((tx) => tx.listingId));
      const demoTransactions = readDemoTransactions()
        .filter((tx) => !existingListingIds.has(tx.listingId))
        .map((tx): TransactionWithCounterparty => ({
          id: tx.id,
          listingId: tx.listingId,
          listingTitle: tx.listingTitle,
          listingPrice: tx.amountCents / 100,
          buyerId: null,
          sellerId: tx.sellerId ?? "",
          agreedAmount: tx.amountCents / 100,
          status: "completed",
          source: "stripe",
          offerId: null,
          notes: "Demo checkout: no real payment was collected.",
          createdAt: tx.createdAt,
          updatedAt: tx.createdAt,
          counterpartyId: tx.sellerId ?? "",
          counterpartyUsername: "Demo seller",
          listingImage: null,
          role: "buyer",
        }));

      if (active) {
        setTransactions([...demoTransactions, ...data]);
        setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [ready]);

  if (!ready) return null;

  const filtered =
    tab === "all"
      ? transactions
      : transactions.filter((t) => t.role === (tab === "buying" ? "buyer" : "seller"));

  const buyingCount = transactions.filter((t) => t.role === "buyer").length;
  const sellingCount = transactions.filter((t) => t.role === "seller").length;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto w-full max-w-3xl">
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

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2a1714]">Transaction History</h1>
          <p className="mt-1 text-sm text-[#8a736b]">All your buying and selling activity.</p>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-2">
          {(["all", "buying", "selling"] as Tab[]).map((t) => {
            const label =
              t === "all"
                ? `All (${transactions.length})`
                : t === "buying"
                ? `Buying (${buyingCount})`
                : `Selling (${sellingCount})`;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === t
                    ? "bg-[rgb(var(--brand-accent))] text-white shadow-sm"
                    : "border border-[#e0cfc6] bg-[#faf5f2] text-[#6d4037] hover:bg-[#f1e4dc]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm text-[#8a736b]">Loading transactions…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-10 text-center shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
            <p className="text-sm text-[#8a736b]">No transactions yet.</p>
            <Link
              href="/home"
              className="mt-4 inline-block rounded-full bg-[rgb(var(--brand-accent))] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TransactionCard({ tx }: { tx: TransactionWithCounterparty }) {
  const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const displayAmount = tx.agreedAmount ?? tx.listingPrice;

  return (
    <div className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-4 shadow-[0_6px_16px_rgba(75,36,28,0.04)]">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {tx.listingImage ? (
          <img
            src={tx.listingImage}
            alt={tx.listingTitle}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f1e4dc] text-2xl">
            🛍️
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <p className="flex-1 truncate text-sm font-semibold text-[#2a1714]">
              {tx.listingId ? (
                <Link
                  href={`/listings/${tx.listingId}`}
                  className="hover:underline hover:underline-offset-2"
                >
                  {tx.listingTitle}
                </Link>
              ) : (
                tx.listingTitle
              )}
            </p>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[tx.status] ?? ""}`}
            >
              {STATUS_LABEL[tx.status] ?? tx.status}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8a736b]">
            <span>
              {tx.role === "buyer" ? "Seller" : "Buyer"}:{" "}
              <span className="font-medium text-[#53433d]">@{tx.counterpartyUsername}</span>
            </span>
            <span>
              {SOURCE_LABEL[tx.source] ?? tx.source}
            </span>
            <span>{date}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-[rgb(var(--brand-primary))]">
            ${displayAmount.toFixed(2)}
          </p>
          <p className="text-xs capitalize text-[#8a736b]">{tx.role}</p>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="mt-4">
        <TransactionTimeline status={tx.status} />
      </div>
    </div>
  );
}

const STEPS: { key: string; label: string }[] = [
  { key: "reserved",  label: "Reserved" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
];

const STEP_ORDER: Record<string, number> = {
  reserved: 0,
  confirmed: 1,
  completed: 2,
  cancelled: -1,
};

function TransactionTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <p className="text-xs font-medium text-red-500">Transaction cancelled.</p>
    );
  }

  const current = STEP_ORDER[status] ?? 0;

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = current >= i;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                  done
                    ? "border-[rgb(var(--brand-accent))] bg-[rgb(var(--brand-accent))] text-white"
                    : "border-[#e0cfc6] bg-white text-[#bba89e]"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-0.5 text-[10px] font-medium ${done ? "text-[rgb(var(--brand-primary))]" : "text-[#bba89e]"}`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mb-3.5 h-0.5 w-12 transition-colors sm:w-20 ${
                  current > i ? "bg-[rgb(var(--brand-accent))]" : "bg-[#e0cfc6]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

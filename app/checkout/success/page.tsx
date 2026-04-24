"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type OrderInfo = {
  id?: number;
  listingId?: string;
  amountCents: number;
  listingTitle?: string;
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    fetch(`/api/checkout/verify?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.paid) {
          setOrder(data.order);
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0ea]">
        <p className="text-sm text-[#8a736b]">Confirming your order…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f6f0ea] px-4">
        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-8 py-10 shadow-[0_12px_30px_rgba(75,36,28,0.06)] text-center max-w-md w-full">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 text-xl font-bold text-[#2a1714]">Something went wrong</h1>
          <p className="mt-2 text-sm text-[#8a736b]">
            We couldn&apos;t confirm your payment. If you were charged, please contact support.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-[rgb(var(--brand-accent))] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95"
          >
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f0ea] px-4">
      <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-8 py-10 shadow-[0_12px_30px_rgba(75,36,28,0.06)] text-center max-w-md w-full">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[#2a1714]">Order confirmed!</h1>
        <p className="mt-2 text-sm text-[#8a736b]">
          Your payment was successful. The seller will be in touch soon.
        </p>

        {order && (
          <div className="mt-6 rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-5 py-4 text-left">
            {order.listingTitle && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#745f59]">Item</span>
                <span className="font-medium text-[#2a1714]">{order.listingTitle}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[#745f59]">Amount paid</span>
              <span className="font-semibold text-[#2a1714]">
                ${(order.amountCents / 100).toFixed(2)}
              </span>
            </div>
            {order.id && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[#745f59]">Order #</span>
                <span className="font-medium text-[#2a1714]">{order.id}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-full bg-[rgb(var(--brand-accent))] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95 text-center"
          >
            Browse more items
          </Link>
          <Link
            href="/messages"
            className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] text-center"
          >
            Message seller
          </Link>
        </div>
      </div>
    </main>
  );
}

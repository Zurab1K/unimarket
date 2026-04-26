"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f0ea] px-4">
      <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-8 py-10 shadow-[0_12px_30px_rgba(75,36,28,0.06)] text-center max-w-md w-full">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f1e4dc]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[rgb(var(--brand-primary))]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[#2a1714]">Payment cancelled</h1>
        <p className="mt-2 text-sm text-[#8a736b]">
          No worries — your card was not charged. You can go back and try again whenever you&apos;re ready.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full bg-[rgb(var(--brand-accent))] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-95"
          >
            Go back to listing
          </button>
          <Link
            href="/"
            className="flex-1 rounded-full border border-[#e0cfc6] bg-[#faf5f2] py-3 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] text-center"
          >
            Browse marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

const mentees = [
  "Ali Chen",
  "Dimash Madiyar",
  "Gurami Janashia",
  "Leo Dicello",
];

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <Link
          href="/home"
          className="flex items-center gap-2 text-sm font-medium text-[#7a5a52] transition hover:text-[rgb(var(--brand-primary))]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to marketplace
        </Link>

        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-8 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Team
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#2a1714]">
            The people behind UniMarket
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#745f59] sm:text-base">
            UniMarket was built through Stony Brook Computing Society&apos;s Project Quack program.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] p-6 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
              Mentor
            </p>
            <div className="mt-5 rounded-[1.5rem] border border-[#f0e7e0] bg-[#fcfaf7] px-5 py-5">
              <p className="text-xl font-semibold text-[#2a1714]">
                Zurabi Kochiashvili
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] p-6 shadow-[0_12px_25px_rgba(75,36,28,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
              Mentees
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {mentees.map((name) => (
                <div
                  key={name}
                  className="rounded-[1.5rem] border border-[#f0e7e0] bg-[#fcfaf7] px-5 py-5"
                >
                  <p className="text-lg font-semibold text-[#2a1714]">{name}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

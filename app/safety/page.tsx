import Link from "next/link";
import { AI_SAFETY_BOUNDARIES, PROHIBITED_ITEMS, PUBLIC_MEETUP_GUIDANCE } from "@/lib/trustSafety";

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-24 pt-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Trust and safety
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#2a1714]">UniMarket Safety Guide</h1>
          <p className="mt-3 text-sm leading-7 text-[#745f59]">
            UniMarket is designed for student-to-student exchanges. Use public pickup zones,
            keep records in messages, and report anything that feels unsafe or dishonest.
          </p>
        </header>

        <PolicySection title="Meetup rules" items={PUBLIC_MEETUP_GUIDANCE} />
        <PolicySection title="Do not post these items" items={PROHIBITED_ITEMS} />
        <PolicySection title="AI assistant boundaries" items={AI_SAFETY_BOUNDARIES} />

        <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-5">
          <h2 className="text-lg font-semibold text-[#2a1714]">When to walk away</h2>
          <p className="mt-2 text-sm leading-7 text-[#745f59]">
            Stop the exchange if someone asks for advance payment, tries to move the conversation
            off-platform immediately, changes the meetup to a private place, refuses inspection, or
            pressures you to decide quickly.
          </p>
          <Link
            href="/home"
            className="mt-4 inline-flex rounded-full bg-[rgb(var(--brand-accent))] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Back to marketplace
          </Link>
        </section>
      </div>
    </main>
  );
}

function PolicySection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-5">
      <h2 className="text-lg font-semibold text-[#2a1714]">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-7 text-[#745f59]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--brand-accent))]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

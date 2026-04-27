import Link from "next/link";
import { PROHIBITED_ITEMS } from "@/lib/trustSafety";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-24 pt-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Policies
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#2a1714]">Terms of Use</h1>
          <p className="mt-3 text-sm leading-7 text-[#745f59]">
            These terms set expectations for a campus pilot. They are not a substitute for
            legal review before a full public launch.
          </p>
        </header>

        <TextBlock title="Student marketplace use">
          Use UniMarket for lawful student marketplace activity. You are responsible for your
          listings, messages, meetups, and compliance with university rules.
        </TextBlock>

        <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-5">
          <h2 className="text-lg font-semibold text-[#2a1714]">Prohibited content</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[#745f59]">
            {PROHIBITED_ITEMS.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--brand-accent))]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <TextBlock title="Payments and disputes">
          Demo checkout does not collect card details or move money. For real exchanges, inspect
          items before paying and keep agreement details in messages. UniMarket does not provide
          escrow or guarantee item quality in this pilot.
        </TextBlock>

        <TextBlock title="Moderation">
          Listings or accounts may be removed when they appear unsafe, fraudulent, abusive, or
          inconsistent with these terms. Reports should avoid unnecessary private information.
        </TextBlock>

        <Link
          href="/privacy"
          className="inline-flex rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-5 py-2.5 text-sm font-semibold text-[#6d4037] transition hover:bg-[#f1e4dc]"
        >
          Read privacy notice
        </Link>
      </div>
    </main>
  );
}

function TextBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-5">
      <h2 className="text-lg font-semibold text-[#2a1714]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[#745f59]">{children}</p>
    </section>
  );
}

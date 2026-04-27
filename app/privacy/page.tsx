import Link from "next/link";

const PRIVACY_POINTS = [
  "Use the minimum profile information needed for campus marketplace trust.",
  "Do not post private addresses, dorm room numbers, phone numbers, or payment credentials in listings.",
  "Messages and transaction records may be needed for safety reports and disputes.",
  "Account deletion is available from Settings and removes profile, listings, saved items, messages, reviews, and auth access.",
  "AI chat should not receive sensitive personal, financial, or student-identifying information.",
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-24 pt-24">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
            Policies
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#2a1714]">Privacy Notice</h1>
          <p className="mt-3 text-sm leading-7 text-[#745f59]">
            This notice explains the project’s privacy expectations for a campus pilot. Get formal
            legal review before a full production launch.
          </p>
        </header>

        <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-5">
          <h2 className="text-lg font-semibold text-[#2a1714]">Privacy commitments</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[#745f59]">
            {PRIVACY_POINTS.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--brand-accent))]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] p-5">
          <h2 className="text-lg font-semibold text-[#2a1714]">Data users should avoid sharing</h2>
          <p className="mt-2 text-sm leading-7 text-[#745f59]">
            Avoid sharing government IDs, student ID numbers, dorm room numbers, passwords,
            one-time codes, banking details, or off-platform payment credentials.
          </p>
        </section>

        <Link
          href="/settings"
          className="inline-flex rounded-full bg-[rgb(var(--brand-accent))] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
        >
          Manage account settings
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import { PUBLIC_MEETUP_GUIDANCE } from "@/lib/trustSafety";

export default function SafetyNotice({
  title = "Meetup safety",
  compact = false,
}: {
  title?: string;
  compact?: boolean;
}) {
  const items = compact ? PUBLIC_MEETUP_GUIDANCE.slice(0, 3) : PUBLIC_MEETUP_GUIDANCE;

  return (
    <section className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--brand-primary))]">
            {title}
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5f4841]">
            {items.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--brand-accent))]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/safety"
          className="shrink-0 rounded-full border border-[#e0cfc6] bg-[#faf5f2] px-3 py-1.5 text-xs font-semibold text-[#6d4037] transition hover:bg-[#f1e4dc]"
        >
          Safety guide
        </Link>
      </div>
    </section>
  );
}

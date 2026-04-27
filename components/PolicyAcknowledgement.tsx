"use client";

import Link from "next/link";

export default function PolicyAcknowledgement({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-[#eadccf] bg-[#fcfaf7] p-3 text-sm leading-6 text-[#5f4841]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 shrink-0"
      />
      <span>
        I will only post items I am allowed to sell, avoid private addresses, use public campus
        meetup points, and follow the{" "}
        <Link href="/terms" className="font-semibold text-[rgb(var(--brand-primary))] underline">
          Terms
        </Link>
        ,{" "}
        <Link href="/privacy" className="font-semibold text-[rgb(var(--brand-primary))] underline">
          Privacy Notice
        </Link>
        , and{" "}
        <Link href="/safety" className="font-semibold text-[rgb(var(--brand-primary))] underline">
          Safety Guide
        </Link>
        .
      </span>
    </label>
  );
}

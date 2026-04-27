"use client";

import { useState } from "react";

type StoredReport = {
  id: string;
  listingId: number;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  reason: string;
  details: string;
  createdAt: string;
};

const REPORTS_KEY = "unimarket-local-reports";
const BLOCKED_SELLERS_KEY = "unimarket-blocked-sellers";

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export default function ReportListingButton({
  listingId,
  listingTitle,
  sellerId,
  sellerName,
}: {
  listingId: number;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("unsafe-meetup");
  const [details, setDetails] = useState("");
  const [blockSeller, setBlockSeller] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function submitReport() {
    const report: StoredReport = {
      id: `${listingId}-${Date.now()}`,
      listingId,
      listingTitle,
      sellerId,
      sellerName,
      reason,
      details: details.trim(),
      createdAt: new Date().toISOString(),
    };
    const reports = readJsonArray<StoredReport>(REPORTS_KEY);
    window.localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...reports].slice(0, 100)));

    if (blockSeller) {
      const blocked = new Set(readJsonArray<string>(BLOCKED_SELLERS_KEY));
      blocked.add(sellerId);
      window.localStorage.setItem(BLOCKED_SELLERS_KEY, JSON.stringify(Array.from(blocked)));
    }

    setSubmitted(true);
    setOpen(false);
    setDetails("");
  }

  return (
    <div className="rounded-2xl border border-[#eadccf] bg-[#fffaf6] px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--brand-primary))]">
            Trust and safety
          </p>
          <p className="mt-1 text-sm leading-6 text-[#745f59]">
            Report suspicious listings, unsafe meetup requests, harassment, or prohibited items.
          </p>
          {submitted ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Report saved locally for review handoff.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          {open ? "Close report" : "Report listing"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 space-y-3 rounded-xl border border-[#eadccf] bg-[#fcfaf7] p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8a736b]">
              Reason
            </span>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-xl border border-[#e0cfc6] bg-white px-3 py-2 text-sm"
            >
              <option value="unsafe-meetup">Unsafe meetup request</option>
              <option value="scam">Possible scam or fake item</option>
              <option value="prohibited">Prohibited item</option>
              <option value="harassment">Harassment or abusive behavior</option>
              <option value="privacy">Privacy or personal information issue</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[#8a736b]">
              Details
            </span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-[#e0cfc6] bg-white px-3 py-2 text-sm"
              placeholder="Add what happened, without sharing private information."
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#5f4841]">
            <input
              type="checkbox"
              checked={blockSeller}
              onChange={(event) => setBlockSeller(event.target.checked)}
              className="h-4 w-4"
            />
            Block this seller locally on this browser
          </label>
          <button
            type="button"
            onClick={submitReport}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Save report
          </button>
        </div>
      ) : null}
    </div>
  );
}

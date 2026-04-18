"use client";

import { useEffect, useRef, useState } from "react";

interface DeleteConfirmModalProps {
  title: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export default function DeleteConfirmModal({
  title,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_24px_64px_rgba(63,27,21,0.18)]">
        {/* Icon */}
        <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#2a1714]">Delete listing?</h3>
            <p className="mt-1.5 text-sm text-[#745f59]">
              <span className="font-medium">&quot;{title}&quot;</span> will be permanently removed. This
              cannot be undone.
            </p>
          </div>

          {error && (
            <p className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-[#eadccf] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-full border border-[#e0cfc6] py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 active:scale-[0.97] disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

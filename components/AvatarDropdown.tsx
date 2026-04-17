"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AvatarMenuProps = {
  imagePath?: string;
};

type AccountSummary = {
  label: string;
  detail: string;
};

function buildAccountSummary(email: string | null, username: unknown): AccountSummary {
  const normalizedUsername =
    typeof username === "string" && username.trim().length > 0 ? username.trim() : null;
  const normalizedEmail = email?.trim() ?? "";

  if (normalizedUsername && normalizedEmail) {
    return {
      label: normalizedUsername,
      detail: normalizedEmail,
    };
  }

  if (normalizedEmail) {
    return {
      label: normalizedEmail.split("@")[0] || "Account",
      detail: normalizedEmail,
    };
  }

  return {
    label: "Account",
    detail: "Signed in",
  };
}

export default function AvatarMenu({
  imagePath = "/placeholder-avatar-picture.jpg",
}: AvatarMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<AccountSummary>({
    label: "Account",
    detail: "Signed in",
  });

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setAccount(buildAccountSummary(user.email ?? null, user.user_metadata?.username));
    }

    loadAccount();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed", err);
    }
    setOpen(false);
    router.replace("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-2 py-1.5 text-left text-white transition hover:bg-white/15"
        aria-label="Open account menu"
      >
        <Image
          src={imagePath}
          alt="Profile avatar"
          width={36}
          height={36}
          className="rounded-full border border-white/20 object-cover shadow-sm"
        />

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold leading-4 text-white">{account.label}</p>
          <p className="truncate text-xs text-white/70">{account.detail}</p>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 text-white/80 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-2xl border border-[#eadfd6] bg-white shadow-[0_20px_45px_rgba(39,18,15,0.18)]">
          <div className="border-b border-[#f1e7df] bg-[#fcf7f2] px-4 py-4">
            <p className="truncate text-sm font-semibold text-[#241512]">{account.label}</p>
            <p className="truncate text-xs text-[#7a635d]">{account.detail}</p>
          </div>

          <div className="p-2">
            <button
              type="button"
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#2d1a16] transition hover:bg-[#f8f1eb]"
            >
              Profile
            </button>
            <button
              type="button"
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#2d1a16] transition hover:bg-[#f8f1eb]"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#b33b2f] transition hover:bg-[#fff3f1]"
            >
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

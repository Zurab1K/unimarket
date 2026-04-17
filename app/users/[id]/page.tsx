"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { getProfileByUserId, type UserProfile } from "@/lib/supabaseData";

export default function PublicProfilePage() {
  const ready = useAuthGuard();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !userId) return;
    let active = true;

    async function load() {
      setLoading(true);
      const data = await getProfileByUserId(userId);
      if (!active) return;

      if (!data) {
        setError("Profile not found.");
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [ready, userId]);

  if (!ready) return null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0ea]">
        <p className="text-sm text-[#8a736b]">Loading profile…</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f0ea] px-4">
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error ?? "Profile not found."}
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-[#b15b46] underline underline-offset-2"
        >
          Go back
        </button>
      </main>
    );
  }

  const initials = (profile.full_name ?? profile.username ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-4 pb-28 pt-24">
      <div className="mx-auto w-full max-w-xl">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#7a5a52] transition hover:text-[#b15b46]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>

        <div className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-8 shadow-[0_12px_30px_rgba(75,36,28,0.06)]">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-4 pb-6 border-b border-[#eadccf]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f4e0d6] text-2xl font-bold text-[#b15b46]">
              {initials}
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#2a1714]">
                {profile.full_name ?? profile.username}
              </h1>
              {profile.full_name && (
                <p className="mt-0.5 text-sm text-[#8a736b]">@{profile.username}</p>
              )}
            </div>
          </div>

          {/* Info fields */}
          <dl className="mt-6 space-y-4 text-sm">
            <InfoRow label="Campus" value={profile.campus} />
            <InfoRow label="Major" value={profile.major} />
            {memberSince && <InfoRow label="Member since" value={memberSince} />}
          </dl>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#f0e7e0] bg-[#fcfaf7] px-4 py-3">
      <dt className="font-medium text-[#2a1714]">{label}</dt>
      <dd className="text-[#53433d]">{value ?? "—"}</dd>
    </div>
  );
}

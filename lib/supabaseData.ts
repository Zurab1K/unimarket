"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export const PROFILE_TABLE = "profiles";
export const LISTINGS_TABLE = "listings";

const PROFILE_SELECT =
  "id, username, full_name, campus, major, interests, budget, notifications, contact, created_at, updated_at";

export type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  campus: string | null;
  major: string | null;
  interests: string[];
  budget: string | null;
  notifications: boolean;
  contact: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProfileUpsertInput = {
  id: string;
  username: string;
  fullName: string;
  campus: string;
  major: string;
  interests: string[];
  budget: string;
  notifications: boolean;
  contact: string;
};

export type ListingRecord = {
  id: number;
  sellerId: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string | null;
  status: string;
  images: string[];
  location: string | null;
  isNegotiable: boolean;
  createdAt: string;
  updatedAt: string;
};

type RawPrimaryProfile = {
  id: string;
  username: string;
  full_name?: string | null;
  campus?: string | null;
  major?: string | null;
  interests?: string[] | null;
  budget?: string | null;
  notifications?: boolean | null;
  contact?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RawListing = {
  id: number;
  seller_id: string;
  title: string;
  description?: string | null;
  price: number | string;
  category: string;
  condition?: string | null;
  status?: string | null;
  images?: unknown;
  location?: string | null;
  is_negotiable?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function normalizeProfile(profile: RawPrimaryProfile): UserProfile {
  return {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name ?? null,
    campus: profile.campus ?? null,
    major: profile.major ?? null,
    interests: Array.isArray(profile.interests) ? profile.interests.filter(Boolean) : [],
    budget: profile.budget ?? null,
    notifications: profile.notifications ?? true,
    contact: profile.contact ?? null,
    created_at: profile.created_at ?? null,
    updated_at: profile.updated_at ?? null,
  };
}

async function getPrimaryProfile(userId: string) {
  return supabase
    .from(PROFILE_TABLE)
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle<RawPrimaryProfile>();
}

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const result = await getPrimaryProfile(userId);

  if (result.data) {
    return normalizeProfile(result.data);
  }

  if (result.error && result.error.code !== "PGRST116") {
    console.error("Failed to load profile", result.error);
  }

  return null;
}

export function isOnboardingComplete(profile: UserProfile | null) {
  if (!profile) return false;

  return Boolean(profile.full_name?.trim() && profile.campus?.trim() && profile.major?.trim());
}

export async function ensureInitialProfile(id: string, username: string): Promise<PostgrestError | null> {
  const normalizedUsername = username.trim();
  const { error } = await supabase.from(PROFILE_TABLE).upsert(
    {
      id,
      username: normalizedUsername,
      notifications: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    return error;
  }

  return null;
}

export async function saveProfileOnboarding(input: ProfileUpsertInput): Promise<PostgrestError | null> {
  const normalizedUsername = input.username.trim();

  const { error } = await supabase.from(PROFILE_TABLE).upsert(
    {
      id: input.id,
      username: normalizedUsername,
      full_name: input.fullName.trim(),
      campus: input.campus.trim(),
      major: input.major.trim(),
      interests: input.interests,
      budget: input.budget.trim(),
      notifications: input.notifications,
      contact: input.contact.trim(),
    },
    { onConflict: "id" },
  );

  if (error) {
    return error;
  }

  return null;
}

function normalizeImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.filter((image): image is string => typeof image === "string" && image.length > 0);
  }

  if (typeof images === "string" && images.length > 0) {
    return [images];
  }

  return [];
}

function normalizeListing(listing: RawListing): ListingRecord {
  return {
    id: listing.id,
    sellerId: listing.seller_id,
    title: listing.title,
    description: listing.description ?? null,
    price: typeof listing.price === "number" ? listing.price : Number(listing.price),
    category: listing.category,
    condition: listing.condition ?? null,
    status: listing.status ?? "available",
    images: normalizeImages(listing.images),
    location: listing.location ?? null,
    isNegotiable: listing.is_negotiable ?? false,
    createdAt: listing.created_at ?? "",
    updatedAt: listing.updated_at ?? "",
  };
}

export async function fetchListings(): Promise<{
  data: ListingRecord[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .select(
      "id, seller_id, title, description, price, category, condition, status, images, location, is_negotiable, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .returns<RawListing[]>();

  return {
    data: (data ?? []).map(normalizeListing),
    error,
  };
}

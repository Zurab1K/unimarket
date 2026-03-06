"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export const PROFILE_TABLE = "profiles";
export const LISTINGS_TABLE = "listings";

const PROFILE_SELECT =
  "id, username, full_name, campus, major, interests, budget, notifications, contact, created_at, updated_at";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type ListingInput = {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  images: string[];
  isNegotiable: boolean;
  status?: string;
};

// ─── Raw DB shapes ────────────────────────────────────────────────────────────

type RawProfile = {
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

const LISTING_SELECT =
  "id, seller_id, title, description, price, category, condition, status, images, location, is_negotiable, created_at, updated_at";

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeProfile(profile: RawProfile): UserProfile {
  return {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name ?? null,
    campus: profile.campus ?? null,
    major: profile.major ?? null,
    interests: Array.isArray(profile.interests)
      ? profile.interests.filter(Boolean)
      : [],
    budget: profile.budget ?? null,
    notifications: profile.notifications ?? true,
    contact: profile.contact ?? null,
    created_at: profile.created_at ?? null,
    updated_at: profile.updated_at ?? null,
  };
}

function normalizeImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.filter(
      (img): img is string => typeof img === "string" && img.length > 0,
    );
  }
  if (typeof images === "string" && images.length > 0) return [images];
  return [];
}

function normalizeListing(listing: RawListing): ListingRecord {
  return {
    id: listing.id,
    sellerId: listing.seller_id,
    title: listing.title,
    description: listing.description ?? null,
    price:
      typeof listing.price === "number"
        ? listing.price
        : Number(listing.price),
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

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfileByUserId(
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle<RawProfile>();

  if (data) return normalizeProfile(data);
  if (error && error.code !== "PGRST116") {
    console.error("Failed to load profile", error);
  }
  return null;
}

export function isOnboardingComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.full_name?.trim() &&
      profile.campus?.trim() &&
      profile.major?.trim(),
  );
}

export async function ensureInitialProfile(
  id: string,
  username: string,
): Promise<PostgrestError | null> {
  const { error } = await supabase.from(PROFILE_TABLE).upsert(
    { id, username: username.trim(), notifications: true },
    { onConflict: "id" },
  );
  return error ?? null;
}

export async function saveProfileOnboarding(
  input: ProfileUpsertInput,
): Promise<PostgrestError | null> {
  const { error } = await supabase.from(PROFILE_TABLE).upsert(
    {
      id: input.id,
      username: input.username.trim(),
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
  return error ?? null;
}

// ─── Listings — read ──────────────────────────────────────────────────────────

export async function fetchListings(): Promise<{
  data: ListingRecord[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .select(LISTING_SELECT)
    .order("created_at", { ascending: false })
    .returns<RawListing[]>();

  return { data: (data ?? []).map(normalizeListing), error };
}

export async function fetchMyListings(): Promise<{
  data: ListingRecord[];
  error: PostgrestError | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: [],
      error: {
        message: "Not authenticated",
        code: "401",
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .select(LISTING_SELECT)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .returns<RawListing[]>();

  return { data: (data ?? []).map(normalizeListing), error };
}

export async function fetchListing(id: number): Promise<{
  data: ListingRecord | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle<RawListing>();

  return { data: data ? normalizeListing(data) : null, error };
}

// ─── Listings — write ─────────────────────────────────────────────────────────

export async function createListing(input: ListingInput): Promise<{
  data: ListingRecord | null;
  error: PostgrestError | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: {
        message: "Not authenticated",
        code: "401",
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .insert({
      seller_id: user.id,
      title: input.title,
      description: input.description,
      price: input.price,
      category: input.category,
      condition: input.condition,
      location: input.location,
      images: input.images,
      is_negotiable: input.isNegotiable,
      status: input.status ?? "available",
    })
    .select(LISTING_SELECT)
    .single<RawListing>();

  return { data: data ? normalizeListing(data) : null, error };
}

export async function updateListing(
  id: number,
  input: Partial<ListingInput>,
): Promise<{
  data: ListingRecord | null;
  error: PostgrestError | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: {
        message: "Not authenticated",
        code: "401",
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.price !== undefined) patch.price = input.price;
  if (input.category !== undefined) patch.category = input.category;
  if (input.condition !== undefined) patch.condition = input.condition;
  if (input.location !== undefined) patch.location = input.location;
  if (input.images !== undefined) patch.images = input.images;
  if (input.isNegotiable !== undefined)
    patch.is_negotiable = input.isNegotiable;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .update(patch)
    .eq("id", id)
    .eq("seller_id", user.id) // belt-and-suspenders on top of RLS
    .select(LISTING_SELECT)
    .single<RawListing>();

  return { data: data ? normalizeListing(data) : null, error };
}

export async function deleteListing(id: number): Promise<{
  error: PostgrestError | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: {
        message: "Not authenticated",
        code: "401",
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  const { error } = await supabase
    .from(LISTINGS_TABLE)
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id); // belt-and-suspenders on top of RLS

  return { error };
}

// ─── Storage — image upload ───────────────────────────────────────────────────

export async function uploadListingImages(files: File[]): Promise<{
  data: string[];
  error: PostgrestError | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: [],
      error: {
        message: "Not authenticated",
        code: "401",
        details: "",
        hint: "",
      } as PostgrestError,
    };
  }

  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      // Return partial success + the error so callers can decide how to handle
      return { data: urls, error: uploadError as unknown as PostgrestError };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("listing-images").getPublicUrl(path);

    urls.push(publicUrl);
  }

  return { data: urls, error: null };
}
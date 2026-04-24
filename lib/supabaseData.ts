"use client";

import type { PostgrestError } from "@supabase/supabase-js";
import { normalizeImageList } from "@/lib/imageSources";
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

export type Review = {
  id: number;
  rating: number;
  comment: string | null;
  reviewerId: string;
  reviewerUsername: string;
  reviewedUserId: string;
  listingId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: number;
  content: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  isRead: boolean;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  participantId: string;
  participantUsername: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isInitiatedByUser: boolean;
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

type RawReview = {
  id: number;
  rating: number;
  comment?: string | null;
  reviewer_id: string;
  reviewed_user_id: string;
  listing_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type RawUsernameProfile = {
  id: string;
  username: string | null;
};

type RawConversationRow = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at?: string | null;
};

type RawMessageRow = RawConversationRow & {
  conversation_id?: string | null;
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
  return normalizeImageList(images);
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

export async function fetchListingsForSeller(
  sellerId: string,
): Promise<{
  data: ListingRecord[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from(LISTINGS_TABLE)
    .select(LISTING_SELECT)
    .eq("seller_id", sellerId)
    .eq("status", "available")
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

export async function fetchSavedListingIds(): Promise<number[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id);

  return (data ?? []).map((r) => r.listing_id);
}

export async function saveListing(
  listingId: number,
): Promise<PostgrestError | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      message: "Not authenticated",
      code: "401",
      details: "",
      hint: "",
    } as PostgrestError;
  }

  const { error } = await supabase.from("saved_listings").insert({
    user_id: user.id,
    listing_id: listingId,
  });

  if (error?.code === "23505") {
    return null;
  }

  return error ?? null;
}

export async function unsaveListing(
  listingId: number,
): Promise<PostgrestError | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      message: "Not authenticated",
      code: "401",
      details: "",
      hint: "",
    } as PostgrestError;
  }

  const { error } = await supabase.from("saved_listings")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listingId);

  return error ?? null;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviewsForUser(userId: string): Promise<{
  data: Review[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, reviewer_id, reviewed_user_id, listing_id, created_at, updated_at"
    )
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false })
    .returns<RawReview[]>();

  if (error) {
    return { data: [], error };
  }

  // Fetch reviewer usernames
  const reviewerIds = Array.from(new Set((data ?? []).map((r) => r.reviewer_id)));
  const { data: reviewers } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", reviewerIds);

  const reviewerMap = new Map(
    ((reviewers ?? []) as RawUsernameProfile[]).map((p) => [p.id, p.username])
  );

  const normalized: Review[] = (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? null,
    reviewerId: r.reviewer_id,
    reviewerUsername: reviewerMap.get(r.reviewer_id) ?? "Unknown",
    reviewedUserId: r.reviewed_user_id,
    listingId: r.listing_id ?? null,
    createdAt: r.created_at ?? "",
    updatedAt: r.updated_at ?? "",
  }));

  return { data: normalized, error: null };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getConversations(userId: string): Promise<{
  data: Conversation[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, is_read, created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error };
  }

  // Group messages by conversation (between two users)
  const rows = (data ?? []) as RawConversationRow[];
  const conversationMap = new Map<
    string,
    Omit<Conversation, "participantId" | "participantUsername">
  >();

  rows.forEach((msg) => {
    const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const isInitiatedByUser = msg.sender_id === userId;

    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, {
        lastMessage: msg.content,
        lastMessageTime: msg.created_at ?? null,
        unreadCount: !isInitiatedByUser && !msg.is_read ? 1 : 0,
        isInitiatedByUser,
      });
    } else {
      const existing = conversationMap.get(otherUserId);
      if (existing && !isInitiatedByUser && !msg.is_read) {
        existing.unreadCount += 1;
      }
    }
  });

  // Fetch usernames for all participants
  const participantIds = Array.from(conversationMap.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", participantIds);

  const profileMap = new Map(
    ((profiles ?? []) as RawUsernameProfile[]).map((p) => [p.id, p.username])
  );

  const conversations: Conversation[] = Array.from(conversationMap.entries()).map(
    ([participantId, data]) => ({
      ...data,
      participantId,
      participantUsername: profileMap.get(participantId) ?? "Unknown",
    })
  );

  return { data: conversations, error: null };
}

export async function getMessagesWithUser(userId: string, otherUserId: string): Promise<{
  data: Message[];
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, content, sender_id, receiver_id, is_read, conversation_id, created_at, updated_at")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    return { data: [], error };
  }

  // Fetch usernames
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", [userId, otherUserId]);

  const profileMap = new Map(
    ((profiles ?? []) as RawUsernameProfile[]).map((p) => [p.id, p.username])
  );

  const rows = (data ?? []) as RawMessageRow[];
  const normalized: Message[] = rows.map((msg) => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.sender_id,
    senderUsername: profileMap.get(msg.sender_id) ?? "Unknown",
    receiverId: msg.receiver_id,
    receiverUsername: profileMap.get(msg.receiver_id) ?? "Unknown",
    isRead: msg.is_read,
    conversationId: msg.conversation_id ?? null,
    createdAt: msg.created_at ?? "",
    updatedAt: msg.updated_at ?? msg.created_at ?? "",
  }));

  return { data: normalized, error: null };
}

export async function sendMessage(
  receiverId: string,
  content: string
): Promise<{ data: Message | null; error: PostgrestError | null }> {
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
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false,
    })
    .select("id, content, sender_id, receiver_id, is_read, conversation_id, created_at, updated_at")
    .single();

  if (error) {
    return { data: null, error };
  }

  // Fetch username for current user
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return {
    data: {
      id: data.id,
      content: data.content,
      senderId: data.sender_id,
      senderUsername: profile?.username ?? "Unknown",
      receiverId: data.receiver_id,
      receiverUsername: "",
      isRead: data.is_read,
      conversationId: data.conversation_id ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    error: null,
  };
}

export async function markMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", userId)
    .eq("is_read", false);
}

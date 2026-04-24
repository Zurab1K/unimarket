import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Account deletion is not configured on this deployment." },
      { status: 500 },
    );
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = user.id;

  const { data: ownedListings, error: ownedListingsError } = await admin
    .from("listings")
    .select("id")
    .eq("seller_id", userId);

  if (ownedListingsError) {
    console.error("Failed to load owned listings before account deletion", ownedListingsError);
    return NextResponse.json({ error: "Failed to prepare account deletion." }, { status: 500 });
  }

  const listingIds = (ownedListings ?? []).map((listing) => listing.id as number);

  if (listingIds.length > 0) {
    const { error: savedForListingsError } = await admin
      .from("saved_listings")
      .delete()
      .in("listing_id", listingIds);

    if (savedForListingsError) {
      console.error("Failed to delete saved listings for owned listings", savedForListingsError);
      return NextResponse.json({ error: "Failed to delete saved listing references." }, { status: 500 });
    }

    const { error: reviewsForListingsError } = await admin
      .from("reviews")
      .delete()
      .in("listing_id", listingIds);

    if (reviewsForListingsError) {
      console.error("Failed to delete reviews for owned listings", reviewsForListingsError);
      return NextResponse.json({ error: "Failed to delete reviews." }, { status: 500 });
    }
  }

  const deletions = await Promise.all([
    admin.from("messages").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    admin.from("reviews").delete().or(`reviewer_id.eq.${userId},reviewed_user_id.eq.${userId}`),
    admin.from("saved_listings").delete().eq("user_id", userId),
    admin.from("listings").delete().eq("seller_id", userId),
    admin.from("profiles").delete().eq("id", userId),
  ]);

  const deletionErrors = deletions
    .map((result) => result.error)
    .filter(Boolean);

  if (deletionErrors.length > 0) {
    console.error("Failed to delete account data", deletionErrors);
    return NextResponse.json({ error: "Failed to delete account data." }, { status: 500 });
  }

  const { data: storageObjects, error: storageListError } = await admin.storage
    .from("listing-images")
    .list(userId, { limit: 1000 });

  if (storageListError) {
    console.error("Failed to list account storage objects", storageListError);
    return NextResponse.json({ error: "Failed to delete account images." }, { status: 500 });
  }

  if ((storageObjects ?? []).length > 0) {
    const paths = storageObjects.map((file) => `${userId}/${file.name}`);
    const { error: storageDeleteError } = await admin.storage.from("listing-images").remove(paths);

    if (storageDeleteError) {
      console.error("Failed to remove account storage objects", storageDeleteError);
      return NextResponse.json({ error: "Failed to delete account images." }, { status: 500 });
    }
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    console.error("Failed to delete auth user", authDeleteError);
    return NextResponse.json({ error: "Failed to delete auth account." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

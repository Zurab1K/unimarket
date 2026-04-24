import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false });
    }

    const { listingId, buyerId, sellerId } = session.metadata ?? {};

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .upsert(
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          listing_id: listingId,
          amount_cents: session.amount_total ?? 0,
          stripe_session_id: sessionId,
          status: "paid",
        },
        { onConflict: "stripe_session_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to save order:", error);
    }

    const { data: listing } = await supabaseAdmin
      .from("listings")
      .update({ status: "sold" })
      .eq("id", Number(listingId))
      .select("title, price")
      .single();

    // Upsert a completed transaction record
    const { data: existingTx } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("listing_id", Number(listingId))
      .not("status", "eq", "cancelled")
      .maybeSingle();

    if (existingTx) {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", existingTx.id);
    } else {
      await supabaseAdmin.from("transactions").insert({
        listing_id: Number(listingId),
        listing_title: listing?.title ?? "",
        listing_price: listing?.price ?? 0,
        buyer_id: buyerId,
        seller_id: sellerId,
        agreed_amount: (session.amount_total ?? 0) / 100,
        status: "completed",
        source: "stripe",
      });
    }

    return NextResponse.json({
      paid: true,
      order: {
        id: order?.id,
        listingId,
        amountCents: session.amount_total ?? 0,
        listingTitle: session.line_items?.data[0]?.description ?? "",
      },
    });
  } catch (err) {
    console.error("Stripe verify failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

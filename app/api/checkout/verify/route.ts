import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type DemoCheckoutSession = {
  listingId: number;
  title: string;
  priceCents: number;
  sellerId: string;
  buyerId: string;
};

function parseDemoSessionId(sessionId: string): DemoCheckoutSession | null {
  if (!sessionId.startsWith("demo_")) return null;

  try {
    const raw = Buffer.from(sessionId.slice(5), "base64url").toString("utf8");
    const session = JSON.parse(raw) as Partial<DemoCheckoutSession>;

    if (
      !session.listingId ||
      !session.title ||
      !session.priceCents ||
      !session.sellerId ||
      !session.buyerId
    ) {
      return null;
    }

    return {
      listingId: Number(session.listingId),
      title: String(session.title),
      priceCents: Number(session.priceCents),
      sellerId: String(session.sellerId),
      buyerId: String(session.buyerId),
    };
  } catch {
    return null;
  }
}

function createOrderResponse(session: DemoCheckoutSession, orderId?: number) {
  return {
    paid: true,
    demo: true,
    order: {
      id: orderId,
      listingId: session.listingId,
      amountCents: session.priceCents,
      listingTitle: session.title,
      sellerId: session.sellerId,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const demoSession = parseDemoSessionId(sessionId);
    if (!demoSession) {
      return NextResponse.json({ error: "Invalid demo checkout session" }, { status: 400 });
    }

    const { listingId, buyerId, sellerId, priceCents, title } = demoSession;
    const hasAdminConfig =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

    if (!hasAdminConfig) {
      return NextResponse.json(createOrderResponse(demoSession));
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .upsert(
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          listing_id: listingId,
          amount_cents: priceCents,
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

    // Demo checkout intentionally does not mark the listing sold. This keeps
    // fake showcase inventory available while still proving the purchase flow.
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
        listing_title: title,
        listing_price: priceCents / 100,
        buyer_id: buyerId,
        seller_id: sellerId,
        agreed_amount: priceCents / 100,
        status: "completed",
        source: "stripe",
        notes: "Demo checkout: no real payment was collected.",
      });
    }

    return NextResponse.json(createOrderResponse(demoSession, order?.id));
  } catch (err) {
    console.error("Demo checkout verification failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { listingId, title, priceCents, sellerId, buyerId } =
      await request.json();

    if (!listingId || !title || !priceCents || !sellerId || !buyerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: title },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        listingId: String(listingId),
        buyerId,
        sellerId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session creation failed:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

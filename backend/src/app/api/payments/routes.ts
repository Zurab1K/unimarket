// src/app/api/payments/route.ts
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { amount, currency } = await req.json();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
  });
  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}

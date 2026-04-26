import { NextRequest, NextResponse } from "next/server";

type DemoCheckoutSession = {
  listingId: number;
  title: string;
  priceCents: number;
  sellerId: string;
  buyerId: string;
};

function getAppUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    request.nextUrl.origin
  );
}

function createDemoSessionId(session: DemoCheckoutSession) {
  const encoded = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `demo_${encoded}`;
}

export async function POST(request: NextRequest) {
  try {
    const { listingId, title, priceCents, sellerId, buyerId } =
      await request.json();

    if (!listingId || !title || !priceCents || !sellerId || !buyerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sessionId = createDemoSessionId({
      listingId: Number(listingId),
      title: String(title),
      priceCents: Number(priceCents),
      sellerId: String(sellerId),
      buyerId: String(buyerId),
    });

    return NextResponse.json({
      url: `${getAppUrl(request)}/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
    });
  } catch (err) {
    console.error("Demo checkout session creation failed:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

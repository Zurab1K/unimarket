// src/app/api/listings/route.ts
import { NextResponse } from "next/server";
import Listing from "@/models/Listing";
import { connectDB } from "@/lib/db";

export async function GET() {
  await connectDB();
  const listings = await Listing.find({});
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const newListing = await Listing.create(data);
  return NextResponse.json(newListing);
}

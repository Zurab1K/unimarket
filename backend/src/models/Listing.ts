// src/models/Listing.ts
import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  category: String,
  condition: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  images: [String],
  status: { type: String, default: "available" },
}, { timestamps: true });

export default mongoose.models.Listing || mongoose.model("Listing", listingSchema);

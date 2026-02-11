"use client";

import ListingCard from "@/components/ListingCard";
import SortDropdown, { SortOption } from "@/components/SortDropdown";
import { useState } from "react";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function MarketplaceHome() {
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const ready = useAuthGuard();
  if (!ready) return null;

  const listings = [
    { title: "MacBook Pro", location: "NYC • 10 min ago", price: 1200, image: "/laptop.jpg", date: 10 },
    { title: "IPad Air", location: "NYC • 30 min ago", price: 300, image: "/ipad.jpg", date: 30 },
    { title: "IPad Air", location: "NYC • 2 hours ago", price: 300, image: "/ipad.jpg", date: 120 },
    { title: "IPad Air", location: "NYC • 1 day ago", price: 300, image: "/ipad.jpg", date: 1440 }
  ];

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === "latest") return a.date - b.date; // smaller minutes = newer
    if (sortBy === "oldest") return b.date - a.date;
    if (sortBy === "priceLow") return a.price - b.price;
    if (sortBy === "priceHigh") return b.price - a.price;
    return 0;
  });

  return (
    <main className="min-h-screen w-full snap-y snap-proximity">
      {/* HERO SECTION */}
      <section
        className="
          h-screen 
          flex flex-col items-center justify-center 
          snap-start 
          bg-gradient-to-br from-[#3B0D11] via-[#70161E] to-[#A71D31]
          animate-gradientShift
          bg-[length:200%_200%]
        "
      >
        <h1 className="text-5xl font-bold text-white select-none">
          Welcome to UniMarket
        </h1>
        <p className="text-lg text-white/90 mt-4 select-none">
          Buy, sell, and trade with your campus community.
        </p>
        <div className="mt-3 flex items-center bg-white rounded-full border overflow-hidden
                focus-within:ring-2 focus-within:ring-black/20">
          <input
            className="flex-1 px-4 py-2 outline-none text-black"
            type="text"
            placeholder="Quick Search"
          />
          <button
            aria-label="Search"
            className="px-4 h-full hover:bg-orange-400 transition active:scale-95 bg-orange-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-black"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.6-4.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* LISTINGS SECTION */}
      <section
        className="
          min-h-screen 
          w-full 
          flex flex-col 
          items-center
          snap-start 
          bg-[#F9F9F9]
          pt-24 pb-32
        "
      >
        <div className="
    relative w-full max-w-[1000px]
    flex items-center justify-center
    px-4
">
          <p className="text-3xl font-semibold text-black select-none text-center">
            Featured Listings
          </p>

          <div className="hidden sm:block absolute right-0">
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          <div className="sm:hidden mt-4">
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10 mt-12 w-full px-4 justify-items-center">
          {sortedListings.map((item, index) => (
            <ListingCard
              key={index}
              title={item.title}
              location={item.location}
              price={`$${item.price}`}
              image={item.image}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

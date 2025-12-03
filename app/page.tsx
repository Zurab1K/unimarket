"use client";

import ListingCard from "@/components/ListingCard";
import SortDropdown, { SortOption } from "@/components/SortDropdown";
import { useState } from "react";

export default function Home() {

  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const listings = [
    { title: "MacBook Pro", location: "NYC • 10 min ago", price: 1200, image: "/laptop.jpg", date: 10 },
    { title: "IPad Air", location: "NYC • 30 min ago", price: 300, image: "/ipad.jpg", date: 30 },
    { title: "IPad Air", location: "NYC • 2 hours ago", price: 300, image: "/ipad.jpg", date: 120 },
    { title: "IPad Air", location: "NYC • 1 day ago", price: 300, image: "/ipad.jpg", date: 1440 }
  ];

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === "latest") return a.date - b.date;      // smaller minutes = newer
    if (sortBy === "oldest") return b.date - a.date;
    if (sortBy === "priceLow") return a.price - b.price;
    if (sortBy === "priceHigh") return b.price - a.price;
    return 0;
  });

  return (
    <main
      className="min-h-screen w-full snap-y snap-proximity"
    >
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

        <div className="relative w-full max-w-[1000px] flex items-center justify-center">
          <p className="text-3xl font-semibold text-black select-none text-center">
            Featured Listings
          </p>

          <div className="absolute right-0">
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-10 mt-12">
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

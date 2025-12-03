"use client";

import ListingCard from "@/components/ListingCard";

export default function Home() {
  return (
    <main 
      className="
        h-screen 
        w-full 
        overflow-y-scroll 
        snap-y 
        snap-mandatory
      "
    >
      {/* HERO SECTION */}
      <section 
        className="
          h-screen 
          flex flex-col items-center justify-center 
          snap-start 
          bg-gradient-to-br from-cyan-100 via-blue-300 to-indigo-400
        "
      >
        <h1 className="text-5xl font-bold text-white select-none">
          Welcome to Quack Marketplace
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
          bg-gradient-to-b from-white via-red-50 to-red-100
          pt-24 pb-32
        "
      >
        <p className="text-xl font-semibold text-gray-800 text-center mb-10">
          Featured Listings
        </p>

        <div className="grid grid-cols-4 gap-8 max-w-7xl px-8">
          <ListingCard title="MacBook Pro" location="NYC • 10 min ago" price="$1200" />
          <ListingCard title="Mini Fridge" location="Dorm A" price="$80" />
          <ListingCard title="LED Lights" location="Dorm B" price="$15" />
          <ListingCard title="Office Chair" location="Dorm C" price="$40" />
        </div>
      </section>
    </main>
  );
}

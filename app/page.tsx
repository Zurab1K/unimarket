"use client";

import ListingCard from "@/components/ListingCard";

export default function Home() {
  return (
    <main 
      className="
        h-screen 
        overflow-y-scroll 
        snap-y snap-proximity 
        scroll-smooth
        scroll-pt-24
      "
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
        <p className="text-3xl font-semibold text-black select-none">
          Featured Listings
        </p>

        <div className="grid grid-cols-4 gap-10 mt-12">

          <ListingCard
            title="MacBook Pro"
            location="NYC • 10 min ago"
            price="$1200"
            image="/laptop.jpg"
          />

          <ListingCard
            title="IPad Air"
            location="NYC • 30 min ago"
            price="$300"
            image="/ipad.jpg"
          />

          <ListingCard
            title="IPad Air"
            location="NYC • 30 min ago"
            price="$300"
            image="/ipad.jpg"
          />

          <ListingCard
            title="IPad Air"
            location="NYC • 30 min ago"
            price="$300"
            image="/ipad.jpg"
          />

        </div>
      </section>
    </main>
  );
}

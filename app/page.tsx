"use client";

import { useEffect, useRef } from "react";
import ListingCard from "@/components/ListingCard";

export default function Home() {
  const listingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let hasAutoScrolled = false; // resets every page load

    function handleScroll() {
      if (hasAutoScrolled) return; // prevent future auto scrolls

      if (window.scrollY > 10 && listingsRef.current) {
        hasAutoScrolled = true; // mark as used
        window.scrollTo({
          top: listingsRef.current.offsetTop,
          behavior: "smooth",
        });
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-white to-red-100">

      {/* HERO SECTION */}
      <section className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-gray-800 select-none">
          Welcome to Quack Marketplace
        </h1>
        <p className="text-lg text-gray-600 mt-4 select-none">
          Buy, sell, and trade with your campus community.
        </p>
      </section>

      {/* LISTINGS SECTION */}
      <section ref={listingsRef} className="w-full max-w-7xl mx-auto mt-16 px-8 pb-24">

        <p className="text-xl font-semibold text-gray-800 text-center mb-8">
          Featured Listings
        </p>

        <div className="grid grid-cols-4 gap-8">

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


import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ListingCard from "@/components/ListingCard";


export default function Home() {
  
  const itemClass = "p-6 bg-white rounded-3xl shadow text-center aspect-square";

  return (
    <main className="flex min-h-screen flex-col p-24 bg-gradient-to-b from-white to-red-100">

      {/* Hero Section */}
      <div className="w-full text-center max-w-md mx-auto mt-10">
        <p className="text-lg text-gray-700 whitespace-nowrap select-none font-semibold">
          Hero Section
        </p>
      </div>

      {/* Listings Section */}
      
      <div className="w-full max-w-7xl mx-auto mt-16">
        
        <p className="text-lg text-gray-700 mb-5 whitespace-nowrap select-none font-semibold text-center">
          Featured Listings
        </p>

        {/* 4-column grid */}
        <div className="grid grid-cols-4 gap-8">

          <ListingCard
            title="MacBook Pro"
            location="NYC • 10 min ago"
            price="$1200"
          />

          <ListingCard
            title="Mini Fridge"
            location="Dorm A"
            price="$80"
          />

          <ListingCard
            title="LED Lights"
            location="Dorm B"
            price="$15"
          />

          <ListingCard
            title="Office Chair"
            location="Dorm C"
            price="$40"
          />
        </div>
      </div>
    </main>
  );
}

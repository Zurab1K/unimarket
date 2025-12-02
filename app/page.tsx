
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  
  const itemClass = "p-4 bg-white rounded-lg shadow text-center aspect-square";

  return (
    <main className="flex min-h-screen flex-col p-24 bg-gradient-to-b from-white to-red-100">

      {/* Hero Section */}
      <div className="w-full text-center max-w-md mx-auto mt-10">
        <p className="text-lg text-gray-700 whitespace-nowrap select-none font-semibold">
          Hero Section
        </p>
      </div>

      {/* Listings Section */}
      <div className="w-full max-w-6xl mx-auto mt-16">
        <p className="text-lg text-gray-700 mb-5 whitespace-nowrap select-none font-semibold text-center">
          Listings
        </p>

        {/* 5-column grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* Example Items */}
          <div className={itemClass}>Item 1</div>
          <div className={itemClass}>Item 2</div>
          <div className={itemClass}>Item 3</div>
          <div className={itemClass}>Item 4</div>
          <div className={itemClass}>Item 5</div>

          <div className={itemClass}>Item 6</div>
          <div className={itemClass}>Item 7</div>
          <div className={itemClass}>Item 8</div>
          <div className={itemClass}>Item 9</div>
          <div className={itemClass}>Item 10</div>
        </div>
      </div>

    </main>
  );
}

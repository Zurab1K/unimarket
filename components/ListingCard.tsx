"use client";

import Link from "next/link";
import { useState } from "react";
import FallbackImage from "@/components/FallbackImage";
import { saveListing, unsaveListing } from "@/lib/supabaseData";

interface ListingCardProps {
  id: number;
  title: string;
  location: string;
  price: string;
  image: string;
  initialLiked?: boolean;
  onUnlike?: () => void;
}

export default function ListingCard({
  id,
  title,
  location,
  price,
  image,
  initialLiked = false,
  onUnlike,
}: ListingCardProps) {
  const [liked, setLiked] = useState(initialLiked);

  async function handleHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    if (next) {
      await saveListing(id);
    } else {
      await unsaveListing(id);
      onUnlike?.();
    }
  }

  return (
    <Link
      href={`/listings/${id}`}
      className="
        relative block h-[260px] w-full overflow-hidden rounded-[1.4rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_14px_36px_rgba(63,27,21,0.08)] select-none
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(63,27,21,0.12)]
        group cursor-pointer
      "
    >
      <div
        className="
          absolute inset-0
          transition-transform duration-500 ease-out
          group-hover:scale-[1.08]
          select-none
        "
      >
        <FallbackImage
          src={image}
          alt={title}
          fill
          draggable="false"
          sizes="(max-width: 640px) 100vw, 320px"
          className="absolute left-0 top-0 h-[178px] w-full object-cover select-none"
        />

        <div
          className="
            absolute bottom-0 left-0 h-[92px] w-full
            bg-gradient-to-b from-[#f5eee8] to-[#eadfd4]
            rounded-b-[1.4rem]
          "
        />
      </div>

      {/* Heart button — preventDefault stops the Link navigation */}
      <button
        type="button"
        aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        onClick={handleHeart}
        className="
          absolute right-4 top-4 z-10 h-9 w-9 rounded-full border border-white/40 bg-[#4d211b]/20 p-1.5 backdrop-blur-sm
          transition-transform duration-300
          hover:scale-[1.05] hover:bg-[#4d211b]/30
        "
      >
        <FallbackImage
          src={liked ? "/heartfilled.png" : "/heart.png"}
          alt=""
          fill
          draggable="false"
          sizes="32px"
          className="p-1.5 filter invert drop-shadow-[0_0_2px_black]"
        />
      </button>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-start justify-between gap-3 px-4 pb-4 pt-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#241512]">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-[#6f5b55]">{location}</p>
        </div>

        <div className="rounded-full bg-[#fff8f2]/85 px-3 py-1 text-sm font-semibold text-[#241512] shadow-sm">
          {price}
        </div>
      </div>
    </Link>
  );
}

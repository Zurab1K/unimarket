"use client";

import Image from "next/image";
import { useState } from "react";

interface ListingCardProps {
    title: string;
    location: string;
    price: string;
    image: string;
}

export default function ListingCard({ title, location, price, image}: ListingCardProps) {

    const [liked, setLiked] = useState(false);

    return (
        <div
            className="
                relative h-[260px] w-full overflow-hidden rounded-[1.4rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_14px_36px_rgba(63,27,21,0.08)] select-none
                transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(63,27,21,0.12)]
                group
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
                <Image
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
                ></div>
            </div>

            <button
                type="button"
                aria-label={liked ? "Remove from favorites" : "Add to favorites"}
                onClick={(e) => {
                    e.stopPropagation();
                    setLiked(!liked);
                }}
                className="
                    absolute right-4 top-4 z-10 h-9 w-9 rounded-full border border-white/40 bg-[#4d211b]/20 p-1.5 backdrop-blur-sm
                    transition-transform duration-300
                    hover:scale-[1.05] hover:bg-[#4d211b]/30
                "
            >
                <Image
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
        </div>
    );
}

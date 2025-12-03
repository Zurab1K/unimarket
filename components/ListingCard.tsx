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
                w-[320px] h-[240px] bg-white rounded-xl relative overflow-hidden shadow-lg select-none
                transform transition-all duration-300 ease-out
                hover:scale-[1.03]
                group
            "
        >
            {/* Animated container (image + gray box) */}
            <div
                className="
                    absolute inset-0
                    transition-transform duration-500 ease-out
                    group-hover:scale-[1.15]
                    select-none
                "
            >
                {/* Item Image */}
                <img
                    src={image}
                    draggable="false"
                    className="absolute top-0 left-0 w-full h-[165px] object-cover select-none"

                />

                {/* Bottom gray box */}
                <div
                    className="
                        absolute bottom-0 left-0 w-full h-[75px]
                        bg-[#E1E1E1]
                        rounded-b-xl
                    "
                ></div>
            </div>

            {/* Heart (Click to toggle) */}
            <img
                src={liked ? "/heartfilled.png" : "/heart.png"}
                draggable="false"
                onClick={(e) => {
                    e.stopPropagation();
                    setLiked(!liked);
                }}
                className="
                    absolute top-[15px] right-[15px] w-[32px] h-[32px] cursor-pointer
                    transition-transform duration-300
                    select-none
                    hover:scale-[1.05]
                    filter invert drop-shadow-[0_0_2px_black]
                "
            />

            {/* Title */}
            <span className="absolute left-[12px] bottom-[40px] text-sm font-medium text-black">
                {title}
            </span>

            {/* Location */}
            <span className="absolute left-[12px] bottom-[15px] text-xs font-light text-black/65">
                {location}
            </span>

            {/* Price */}
            <span className="absolute right-[12px] bottom-[40px] text-sm font-semibold text-black">
                {price}
            </span>
        </div>
    );
}

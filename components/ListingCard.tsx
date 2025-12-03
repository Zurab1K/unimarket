import { useState } from "react";

interface ListingCardProps {
  title: string;
  location: string;
  price: string;
  image: string;
}

export default function ListingCard({ title, location, price, image }: ListingCardProps) {

  const [liked, setLiked] = useState(false);

  return (
    <div
      className="
        w-[290px] h-[220px] bg-white rounded-xl relative overflow-hidden shadow-lg select-none
        transform transition-all duration-300 ease-out
        hover:scale-[1.05]
        group
      "
    >

      {/* Animated container (image + gray box) */}
      <div
        className="
          absolute inset-0
          transition-transform duration-500 ease-out
          group-hover:scale-110
        "
      >
        {/* Item Image */}
        <img
          src={image}
          className="absolute top-0 left-0 w-full h-[145px] object-cover"
        />

        {/* Bottom gray box */}
        <div
          className="
            absolute bottom-0 left-0 w-full h-[75px]
            bg-black/10
            shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)]
            rounded-b-xl
          "
        ></div>
      </div>

      {/* Heart (Click to toggle) */}
      <img
        src={liked ? "/heart-filled.png" : "/heart.png"}
        onClick={(e) => {
          e.stopPropagation();   // prevents parent events
          setLiked(!liked);
        }}
        className="
          absolute top-[15px] right-[15px] w-[32px] h-[32px] cursor-pointer
          transition-transform duration-300
          hover:scale-125 active:scale-90
        "
      />

      {/* Title */}
      <span className="absolute left-[12px] bottom-[40px] text-sm font-medium text-black">
        {title}
      </span>

      {/* Location */}
      <span className="absolute left-[12px] bottom-[15px] text-xs font-light text-black">
        {location}
      </span>

      {/* Price */}
      <span className="absolute right-[12px] bottom-[40px] text-sm font-semibold text-black">
        {price}
      </span>
    </div>
  );
}

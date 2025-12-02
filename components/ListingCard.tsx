interface ListingCardProps {
    title: string;
    location: string;
    price: string;
    image: string;
}

export default function ListingCard({ title, location, price, image }: ListingCardProps) {
    return (
        <div className="w-[290px] h-[220px] bg-white rounded-xl relative overflow-hidden shadow-md select-none">

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 w-full h-[75px] bg-black/20 shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] opacity-30"></div>

            {/* Item Image */}

            <img
                src={image}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Heart */}
            <img
                src="/heart.png"
                className="absolute top-[15px] right-[15px] w-[32px] h-[32px]"
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

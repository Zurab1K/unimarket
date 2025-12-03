"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarMenu from "./AvatarDropdown";

export default function Navbar() {
    const pathname = usePathname();
    if (pathname === "/login") return null;

    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        let lastY = window.scrollY;

        const handleScroll = () => {
            const currentY = window.scrollY;

            if (currentY > lastY && currentY > 60) {
                // scroll down → hide navbar
                setHidden(true);
            } else {
                // scroll up → show navbar
                setHidden(false);
            }

            lastY = currentY;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={`
                fixed top-0 left-0 right-0
                w-full p-2 bg-[#B14242] shadow 
                flex items-center z-50 
                transition-transform duration-500
                ${hidden ? "-translate-y-full" : "translate-y-0"}
            `}
        >
            {/* Left */}
            <div className="flex-none">
                <Link href="/" className="text-2xl select-none">🦆</Link>
            </div>

            {/* Center */}
            <div className="flex-1 flex justify-center space-x-3">
                <Link href="/" className="px-4 py-2 text-white hover:underline hover:bg-[#A43E3E] transition">Home</Link>
                <Link href="/search" className="px-4 py-2 text-white hover:underline hover:bg-[#A43E3E] transition">Search</Link>
                <Link href="/messages" className="px-4 py-2 text-white hover:underline hover:bg-[#A43E3E] transition">Messages</Link>
                <Link href="/saved" className="px-4 py-2 text-white hover:underline hover:bg-[#A43E3E] transition">Saved</Link>
                <Link href="/cart" className="px-4 py-2 text-white hover:underline hover:bg-[#A43E3E] transition">Cart</Link>
            </div>

            {/* Right */}
            <div className="flex-none">
                <AvatarMenu />
            </div>
        </nav>
    );
}

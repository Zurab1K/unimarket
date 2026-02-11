"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarMenu from "./AvatarDropdown";

export default function Navbar() {
    const pathname = usePathname();
    const [hidden, setHidden] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const links = [
        { href: "/home", label: "Home" },
        { href: "/search", label: "Search" },
        { href: "/messages", label: "Messages" },
        { href: "/chat", label: "AI Chat" },
        { href: "/saved", label: "Saved" },
        { href: "/cart", label: "Cart" },
    ];

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

    useEffect(() => {
        if (hidden) {
            setMobileOpen(false);
        }
    }, [hidden]);

    const hideNavbar =
        pathname === "/login" || pathname?.startsWith("/onboarding");
    if (hideNavbar) return null;

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
            <div className="flex-1 flex justify-center">
                {/* Desktop links */}
                <div className="hidden md:flex space-x-3">
                    {links.map(({ href, label }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-4 py-2 text-white transition ${isActive
                                    ? "bg-[#A43E3E] rounded-lg"
                                    : "hover:underline hover:bg-[#A43E3E]"
                                    }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden px-4 py-2 text-white"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {/* Hamburger icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d={
                                mobileOpen
                                    ? "M6 18L18 6M6 6l12 12" // X icon when open
                                    : "M4 6h16M4 12h16M4 18h16" // Hamburger icon when closed
                            }
                        />
                    </svg>
                </button>
            </div>

            {/* Right */}
            <div className="flex-none">
                <AvatarMenu />
            </div>

            {mobileOpen && (
                <div className={`absolute top-full left-0 w-full bg-[#B14242]
                flex flex-col items-center md:hidden z-40
                transition-transform duration-300
                ${mobileOpen ? "translate-y-0" : "-translate-y-full"}
            `}>
                    {links.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="px-4 py-3 text-white w-full text-center hover:bg-[#A43E3E] transition"
                            onClick={() => setMobileOpen(false)} // close on click
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}

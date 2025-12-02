"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AvatarMenu from "./AvatarDropdown";

export default function Navbar() {
    const pathname = usePathname();

    if (pathname === "/login") {
        return null;
    }

    return (
        <>
            <nav className="w-full p-4 bg-gray-100 shadow fixed flex items-center">

                {/* Left (small, fixed) */}
                <div className="flex-none">
                    <Link href="/" className="text-2xl select-none">🦆</Link>
                </div>

                {/* Center (grows to fill space) */}
                <div className="flex-1 flex justify-center space-x-3">
                    <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        Home
                    </Link>

                    <Link href="/search" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        Search
                    </Link>

                    <Link href="/messages" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        Messages
                    </Link>

                    <Link href="/saved" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        Saved
                    </Link>

                    <Link href="/cart" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                        Cart
                    </Link>
                </div>

                {/* Right (small, fixed) */}
                <div className="flex-none">
                    <AvatarMenu />
                </div>

            </nav>

        </>
    );
}

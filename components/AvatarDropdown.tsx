"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AvatarMenu({ imagePath = "/placeholder-avatar-picture.jpg" }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    async function handleLogout() {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Logout failed", err);
        }
        if (typeof window !== "undefined") {
            localStorage.removeItem("onboardingComplete");
            localStorage.removeItem("skipAuth");
            sessionStorage.removeItem("skipAuth");
        }
        setOpen(false);
        router.replace("/login");
    }

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar Button */}
            <button onClick={() => setOpen(!open)}>
                <Image
                    src={imagePath}
                    alt="avatar"
                    width={35}
                    height={35}
                    className="
                        rounded-full cursor-pointer border shadow
                        transform transition duration-200 ease-in-out
                    "
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="
                        absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-50
                        transform transition duration-200 ease-in-out
                    "
                >
                    <button className="w-full text-black text-left px-4 py-2 hover:bg-gray-100">
                        Profile
                    </button>
                    <button className="w-full text-black text-left px-4 py-2 hover:bg-gray-100">
                        Settings
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

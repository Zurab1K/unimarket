"use client";

import { useState } from "react";

// ✅ export type so other files can import it
export type SortOption = "latest" | "oldest" | "priceLow" | "priceHigh";

// (optional) export props type if you want
export interface SortDropdownProps {
    sortBy: SortOption;
    setSortBy: (value: SortOption) => void;
}

export default function SortDropdown({ sortBy, setSortBy }: SortDropdownProps) {

    const [open, setOpen] = useState(false);

    const options: { value: SortOption; label: string }[] = [
        { value: "latest", label: "Latest" },
        { value: "oldest", label: "Oldest" },
        { value: "priceLow", label: "Price: Low → High" },
        { value: "priceHigh", label: "Price: High → Low" },
    ];

    return (
        <div className="relative">
            {/* Button */}
            <button
                onClick={() => setOpen(!open)}
                className="
                    px-4 py-1 border rounded-lg bg-white shadow-sm text-black 
                    w-44 flex items-center justify-between cursor-pointer whitespace-nowrap
                "
            >
                {options.find(o => o.value === sortBy)?.label}

                <svg
                    className={`w-6 h-4 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
                        }`}
                    fill="none"
                    stroke="black"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {open && (
                <div
                    className="
                        absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg z-20 select-none whitespace-nowrap
                    "
                >
                    {options.map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                setSortBy(opt.value);
                                setOpen(false);
                            }}
                            className="
                                px-4 py-1 hover:bg-gray-100 cursor-pointer text-black select-none
                            "
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

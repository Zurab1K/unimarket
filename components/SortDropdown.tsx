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
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="
                    flex w-48 items-center justify-between whitespace-nowrap rounded-xl border border-[#e4d7cc] bg-[#fffaf6] px-4 py-2.5 text-sm font-medium text-[#2e1d19] shadow-sm transition
                    hover:border-[#d3bcaf] hover:bg-white
                "
            >
                <span>Sort: {options.find(o => o.value === sortBy)?.label}</span>

                <svg
                    className={`h-4 w-5 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"
                        }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {open && (
                <div
                    className="
                        absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-[#e4d7cc] bg-[#fffaf6] shadow-lg select-none whitespace-nowrap
                    "
                >
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                setSortBy(opt.value);
                                setOpen(false);
                            }}
                            className="
                                block w-full px-4 py-2.5 text-left text-sm text-[#2e1d19] transition hover:bg-[#f4ece6]
                            "
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

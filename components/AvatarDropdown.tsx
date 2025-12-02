"use client";

import { useState } from "react";
import Image from "next/image";

export default function AvatarMenu() {
const [open, setOpen] = useState(false);

return (
<div className="relative">
    <button onClick={() => setOpen(!open)}>
    <Image
        src="/placeholder-avatar-picture.jpg"   // put a picture in /public/avatar.png
        alt="avatar"
        width={30}
        height={30}
        className="rounded-full cursor-pointer border"
    />
    </button>

    {open && (
    <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md border z-50">
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
        Profile
        </button>
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
        Settings
        </button>
        <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
        Logout
        </button>
    </div>
    )}
</div>
);
}

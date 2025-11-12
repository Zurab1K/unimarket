import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-100 shadow">
      {/* Logo / icon section */}
        <div className="flex items-center text-2xl select-none">🦆</div>

      {/* Navigation buttons */}
        <div className="flex items-center space-x-3">
        <Link href="/listings">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Listings
            </button>
        </Link>

        <Link href="/chat">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Chat
            </button>
        </Link>

        <Link href="/forums">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Cart
            </button>
        </Link>
        </div>
    </nav>
    );
}

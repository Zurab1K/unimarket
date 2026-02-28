"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarMenu from "./AvatarDropdown";

const links = [
  { href: "/home", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/messages", label: "Messages" },
  { href: "/saved", label: "Saved" },
  { href: "/cart", label: "Cart" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY > lastY && currentY > 60) {
        setHidden(true);
      } else {
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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const hideNavbar =
    pathname === "/login" || pathname === "/reset-password" || pathname?.startsWith("/onboarding");
  if (hideNavbar) return null;

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 px-3 py-3 transition-transform duration-500 sm:px-4 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-[#a83f3f]/95 px-3 py-2 text-white shadow-[0_12px_34px_rgba(80,18,18,0.22)] backdrop-blur sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/home"
            className="rounded-xl px-2 py-1.5 transition hover:bg-white/10"
          >
            <p className="font-[family:var(--font-geist-sans)] text-xl font-semibold tracking-[0.02em] text-white">
              UniMarket
            </p>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="flex items-center gap-1 rounded-xl bg-black/10 p-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-[#8e3424] shadow-sm"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <AvatarMenu />
            </div>

            <button
              type="button"
              className="rounded-xl p-2 text-white transition hover:bg-white/10 md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-2 md:hidden">
            <div className="mb-2 flex justify-end sm:hidden">
              <AvatarMenu />
            </div>

            <div className="grid gap-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-[#8e3424]"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

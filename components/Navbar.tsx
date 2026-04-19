"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AvatarMenu from "./AvatarDropdown";

const links = [
  { href: "/home", label: "Home" },
  { href: "/messages", label: "Messages" },
  { href: "/saved", label: "Saved" },
  { href: "/cart", label: "Cart" },
];

const NAVBAR_LOGO_SRC = "/unimarket-logo.png?v=20260418";

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
      className={`fixed left-0 right-0 top-0 z-50 px-2 py-2 transition-transform duration-500 sm:px-3 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto w-full max-w-[calc(100vw-1rem)] rounded-[1.45rem] border border-white/45 bg-[linear-gradient(135deg,rgba(255,252,249,0.72),rgba(255,241,232,0.42))] px-4 py-1.5 text-[#4b2d27] shadow-[0_18px_50px_rgba(78,34,24,0.16)] backdrop-blur-xl sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/home"
            className="flex items-center rounded-xl px-1.5 py-1 transition hover:bg-white/18"
          >
            <Image
              src={NAVBAR_LOGO_SRC}
              alt="UniMarket"
              width={240}
              height={160}
              sizes="(min-width: 768px) 240px, 180px"
              priority
              unoptimized
              className="h-10 w-auto max-w-none object-contain sm:h-11"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <div className="flex min-w-0 flex-1 justify-center">
              <div className="flex w-full max-w-md items-center overflow-hidden rounded-full border border-white/40 bg-white shadow-[0_10px_28px_rgba(78,34,24,0.10)]">
                <input
                  type="text"
                  placeholder="Search textbooks, furniture, electronics..."
                  className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-[#2a1714] outline-none placeholder:text-[#8a736b]"
                />
                <button
                  type="button"
                  aria-label="Search"
                  className="m-1 rounded-full bg-[rgb(var(--brand-accent))] px-4 py-2.5 text-white transition hover:brightness-95 active:scale-95"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m1.6-4.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] transition ${
                      isActive
                        ? "bg-[rgb(var(--brand-accent))] text-white shadow-sm"
                        : "text-[#5d3b34] hover:bg-white/34 hover:text-[#2f1a15]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
            <AvatarMenu />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="hidden sm:block">
              <AvatarMenu />
            </div>
            <button
              type="button"
              className="rounded-xl border border-white/35 bg-white/22 p-1.5 text-[#5d3b34] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] transition hover:bg-white/35 lg:hidden"
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
          <div className="mt-2 rounded-[1.25rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,244,237,0.28))] p-2 shadow-[0_14px_32px_rgba(78,34,24,0.12)] backdrop-blur-xl lg:hidden">
            <div className="mb-2 flex justify-end sm:hidden">
              <AvatarMenu />
            </div>

            <div className="mb-2 flex items-center overflow-hidden rounded-xl border border-white/45 bg-white shadow-[0_8px_22px_rgba(78,34,24,0.08)]">
              <input
                type="text"
                placeholder="Search textbooks, furniture, electronics..."
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-[#2a1714] outline-none placeholder:text-[#8a736b]"
              />
              <button
                type="button"
                aria-label="Search"
                className="m-1 rounded-full bg-[rgb(var(--brand-accent))] px-4 py-2.5 text-white transition hover:brightness-95 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m1.6-4.15a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="grid gap-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[rgb(var(--brand-accent))] text-white shadow-sm"
                        : "text-[#5d3b34] hover:bg-white/35 hover:text-[#2f1a15]"
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

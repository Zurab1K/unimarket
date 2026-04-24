"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchListings, type ListingRecord } from "@/lib/supabaseData";
import { supabase } from "@/lib/supabaseClient";
import { LISTING_CATEGORIES } from "@/lib/listingOptions";
import AvatarMenu from "./AvatarDropdown";

const links = [
  { href: "/home", label: "Home" },
  { href: "/messages", label: "Messages" },
  { href: "/transactions", label: "Transactions" },
  { href: "/saved", label: "Saved" },
  { href: "/cart", label: "Cart" },
];

const NAVBAR_LOGO_SRC = "/unimarket-logo.png?v=20260418";

type SearchSuggestion = {
  label: string;
  query: string;
  type: "listing" | "category";
};

function getSearchSuggestions(query: string, listings: ListingRecord[]): SearchSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const category of LISTING_CATEGORIES) {
    if (category.toLowerCase().includes(normalizedQuery)) {
      const key = `category:${category.toLowerCase()}`;
      if (!seen.has(key)) {
        suggestions.push({ label: category, query: category, type: "category" });
        seen.add(key);
      }
    }
  }

  for (const listing of listings) {
    if (listing.status !== "available") continue;

    const title = listing.title.trim();
    if (!title || !title.toLowerCase().includes(normalizedQuery)) continue;

    const key = `listing:${title.toLowerCase()}`;
    if (seen.has(key)) continue;

    suggestions.push({ label: title, query: title, type: "listing" });
    seen.add(key);
  }

  return suggestions.slice(0, 6);
}

function SearchForm({
  query,
  onQueryChange,
  onSubmit,
  onSuggestionSelect,
  suggestions,
  showSuggestions,
  onFocus,
  onBlur,
  roundedClassName,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSuggestionSelect: (value: string) => void;
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  onFocus: () => void;
  onBlur: () => void;
  roundedClassName: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <form
        onSubmit={onSubmit}
        className={`flex w-full items-center overflow-hidden border border-white/40 bg-white shadow-[0_10px_28px_rgba(78,34,24,0.10)] ${roundedClassName}`}
      >
        <input
          type="text"
          placeholder="Search textbooks, furniture, electronics..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label="Search marketplace listings"
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-[#2a1714] outline-none placeholder:text-[#8a736b]"
        />
        <button
          type="submit"
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
      </form>

      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 overflow-hidden rounded-2xl border border-[#eadccf] bg-[#fffaf6] shadow-[0_18px_40px_rgba(78,34,24,0.14)]">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}:${suggestion.query}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onSuggestionSelect(suggestion.query);
              }}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-[#fff1e8]"
            >
              <span className="truncate text-sm font-medium text-[#2a1714]">{suggestion.label}</span>
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06050]">
                {suggestion.type}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let userId: string | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      userId = session.user.id;

      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("is_read", false)
        .then(({ count: c }) => setCount(c ?? 0));

      const channel = supabase
        .channel("navbar-unread")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
          () => setCount((n) => n + 1))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` },
          (payload) => {
            if ((payload.new as { is_read: boolean }).is_read && !(payload.old as { is_read: boolean }).is_read) {
              setCount((n) => Math.max(0, n - 1));
            }
          })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });
  }, []);

  return count;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [allListings, setAllListings] = useState<ListingRecord[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const unreadCount = useUnreadCount();
  const currentSearchQuery = searchParams.get("search") ?? "";

  useEffect(() => {
    setQuery(currentSearchQuery);
  }, [currentSearchQuery]);

  useEffect(() => {
    let active = true;

    async function loadListings() {
      const result = await fetchListings();
      if (!active || result.error) return;
      setAllListings(result.data);
    }

    loadListings();
    return () => {
      active = false;
    };
  }, []);

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

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    const target = trimmedQuery
      ? `/search?search=${encodeURIComponent(trimmedQuery)}`
      : "/search";

    setSearchFocused(false);
    setMobileOpen(false);
    router.push(target);
  }

  function handleSuggestionSelect(value: string) {
    const trimmedQuery = value.trim();
    setQuery(trimmedQuery);
    setSearchFocused(false);
    setMobileOpen(false);
    router.push(`/search?search=${encodeURIComponent(trimmedQuery)}`);
  }

  const suggestions = getSearchSuggestions(query, allListings);
  const showSuggestions = searchFocused && query.trim().length > 0 && suggestions.length > 0;

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
              <SearchForm
                query={query}
                onQueryChange={setQuery}
                onSubmit={handleSearchSubmit}
                onSuggestionSelect={handleSuggestionSelect}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 100)}
                roundedClassName="rounded-full"
              />
            </div>

            <div className="flex items-center gap-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                const badge = href === "/messages" && unreadCount > 0 ? unreadCount : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] transition ${
                      isActive
                        ? "bg-[rgb(var(--brand-accent))] text-white shadow-sm"
                        : "text-[#5d3b34] hover:bg-white/34 hover:text-[#2f1a15]"
                    }`}
                  >
                    {label}
                    {badge > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
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

            <div className="mb-2">
              <SearchForm
                query={query}
                onQueryChange={setQuery}
                onSubmit={handleSearchSubmit}
                onSuggestionSelect={handleSuggestionSelect}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 100)}
                roundedClassName="rounded-xl"
              />
            </div>

            <div className="grid gap-1">
              {links.map(({ href, label }) => {
                const isActive = pathname === href;
                const badge = href === "/messages" && unreadCount > 0 ? unreadCount : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-[rgb(var(--brand-accent))] text-white shadow-sm"
                        : "text-[#5d3b34] hover:bg-white/35 hover:text-[#2f1a15]"
                    }`}
                  >
                    {label}
                    {badge > 0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
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

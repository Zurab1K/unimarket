"use client";

import ListingCard from "@/components/ListingCard";
import SortDropdown, { SortOption } from "@/components/SortDropdown";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { fetchListings, fetchSavedListingIds, type ListingRecord } from "@/lib/supabaseData";
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/lib/listingOptions";

type ListingCardViewModel = {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  date: number;
  category: string;
  condition: string;
  isNegotiable: boolean;
  searchText: string;
};

type PriceBand = "all" | "under25" | "25to100" | "100to500" | "500plus";
type PostedWithin = "any" | "24h" | "7d" | "30d";

function formatRelativeAge(createdAt: string) {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return "";

  const diffMinutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffMinutes < 1440) {
    const hours = Math.round(diffMinutes / 60);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(diffMinutes / 1440);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function toViewModel(listing: ListingRecord): ListingCardViewModel {
  const pickupLocation = listing.location?.trim() || "Campus meetup";
  const parts = [pickupLocation, formatRelativeAge(listing.createdAt)].filter(Boolean);

  return {
    id: listing.id,
    title: listing.title,
    location: parts.join(" • ") || listing.category,
    price: listing.price,
    image: listing.images[0] ?? "/placeholder-avatar-picture.jpg",
    date:
      Math.max(1, Math.round((Date.now() - Date.parse(listing.createdAt || "")) / 60000)) ||
      Number.MAX_SAFE_INTEGER,
    category: listing.category.trim(),
    condition: (listing.condition ?? "Unspecified").trim(),
    isNegotiable: listing.isNegotiable,
    searchText: [
      listing.title,
      listing.description,
      listing.category,
      listing.location,
      listing.condition,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function FilterCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-[#fff5ee]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[#d9c7bb] text-[rgb(var(--brand-accent))] focus:ring-[rgba(var(--brand-accent),0.22)]"
      />
      <span className="text-sm font-medium text-[#5d4038]">{label}</span>
    </label>
  );
}

function SearchPageContent() {
  const ready = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [listings, setListings] = useState<ListingCardViewModel[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loadingListings, setLoadingListings] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [postedWithin, setPostedWithin] = useState<PostedWithin>("any");
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const normalizedSearchQuery = searchQuery.toLowerCase();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingListings(true);
      const [result, saved] = await Promise.all([fetchListings(), fetchSavedListingIds()]);
      if (!active) return;

      if (result.error) {
        setListingsError(result.error.message);
        setListings([]);
      } else {
        setListings(result.data.filter((listing) => listing.status === "available").map(toViewModel));
        setSavedIds(new Set(saved));
        setListingsError(null);
      }

      setLoadingListings(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredListings = useMemo(() => {
    const matchesPriceBand = (price: number) => {
      if (priceBand === "under25") return price < 25;
      if (priceBand === "25to100") return price >= 25 && price <= 100;
      if (priceBand === "100to500") return price > 100 && price <= 500;
      if (priceBand === "500plus") return price > 500;
      return true;
    };

    const matchesPostedWithin = (ageInMinutes: number) => {
      if (postedWithin === "24h") return ageInMinutes <= 60 * 24;
      if (postedWithin === "7d") return ageInMinutes <= 60 * 24 * 7;
      if (postedWithin === "30d") return ageInMinutes <= 60 * 24 * 30;
      return true;
    };

    const visibleListings = listings.filter((listing) => {
      const matchesSearch =
        normalizedSearchQuery.length === 0 || listing.searchText.includes(normalizedSearchQuery);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(listing.category);
      const matchesCondition =
        selectedConditions.length === 0 || selectedConditions.includes(listing.condition);
      const matchesNegotiable = !negotiableOnly || listing.isNegotiable;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCondition &&
        matchesPriceBand(listing.price) &&
        matchesPostedWithin(listing.date) &&
        matchesNegotiable
      );
    });

    return [...visibleListings].sort((a, b) => {
      if (sortBy === "latest") return a.date - b.date;
      if (sortBy === "oldest") return b.date - a.date;
      if (sortBy === "priceLow") return a.price - b.price;
      if (sortBy === "priceHigh") return b.price - a.price;
      return 0;
    });
  }, [
    listings,
    negotiableOnly,
    normalizedSearchQuery,
    postedWithin,
    priceBand,
    selectedCategories,
    selectedConditions,
    sortBy,
  ]);

  function toggleValue(values: string[], value: string, checked: boolean) {
    if (checked) return [...values, value];
    return values.filter((item) => item !== value);
  }

  if (!ready) return null;

  return (
    <main className="min-h-screen bg-[#f6f0ea] px-2 pb-24 pt-20 sm:px-3">
      <div className="mx-auto flex w-full max-w-[calc(100vw-1rem)] flex-col gap-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="ml-5 mt-3 flex items-center gap-2 self-start text-sm font-medium text-[#7a5a52] transition hover:text-[rgb(var(--brand-primary))]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back
        </button>

        <section className="rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] px-5 py-6 shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[rgb(var(--brand-primary))]">
                Search Results
              </p>

              <h1 className="mt-3 text-3xl font-semibold text-[#2a1714]">
                {searchQuery ? `Showing results for "${searchQuery}"` : "Browse all listings"}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <div className="rounded-full bg-[#f1e4dc] px-4 py-2 text-sm font-medium text-[#855246]">
                {loadingListings
                  ? "Checking marketplace…"
                  : `${filteredListings.length} result${filteredListings.length === 1 ? "" : "s"}`}
              </div>
              <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((previous) => !previous)}
            className="rounded-full border border-[#e0cfc6] bg-[#fffaf6] px-4 py-2 text-sm font-medium text-[#6d4037] shadow-sm transition hover:bg-[#f7eee8]"
          >
            {filtersOpen ? "Hide filters" : "Show filters"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategories([]);
              setSelectedConditions([]);
              setPriceBand("all");
              setPostedWithin("any");
              setNegotiableOnly(false);
            }}
            className="text-sm font-semibold text-[rgb(var(--brand-primary))] underline-offset-4 transition hover:underline"
          >
            Reset filters
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block lg:w-[290px] lg:flex-none`}>
            <div className="sticky top-24 rounded-[1.8rem] border border-[#eadccf] bg-[#fffaf6] p-5 shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#2a1714]">Filters</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedConditions([]);
                    setPriceBand("all");
                    setPostedWithin("any");
                    setNegotiableOnly(false);
                  }}
                  className="text-sm font-semibold text-[rgb(var(--brand-primary))] underline-offset-4 transition hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a736b]">
                    Categories
                  </h3>
                  <div className="mt-3 space-y-1">
                    {LISTING_CATEGORIES.map((category) => (
                      <FilterCheckbox
                        key={category}
                        label={category}
                        checked={selectedCategories.includes(category)}
                        onChange={(checked) =>
                          setSelectedCategories((current) => toggleValue(current, category, checked))
                        }
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a736b]">
                    Condition
                  </h3>
                  <div className="mt-3 space-y-1">
                    {LISTING_CONDITIONS.map((condition) => (
                      <FilterCheckbox
                        key={condition.value}
                        label={condition.label}
                        checked={selectedConditions.includes(condition.value)}
                        onChange={(checked) =>
                          setSelectedConditions((current) =>
                            toggleValue(current, condition.value, checked),
                          )
                        }
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a736b]">
                    Price
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {[
                      { value: "all", label: "All prices" },
                      { value: "under25", label: "Under $25" },
                      { value: "25to100", label: "$25 to $100" },
                      { value: "100to500", label: "$100 to $500" },
                      { value: "500plus", label: "$500+" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriceBand(option.value as PriceBand)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                          priceBand === option.value
                            ? "border-[rgb(var(--brand-accent))] bg-[rgba(var(--brand-accent),0.10)] text-[#5d3127]"
                            : "border-[#eadccf] bg-white text-[#6d4037] hover:bg-[#fff5ee]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a736b]">
                    Posted
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {[
                      { value: "any", label: "Any time" },
                      { value: "24h", label: "Last 24 hours" },
                      { value: "7d", label: "Last 7 days" },
                      { value: "30d", label: "Last 30 days" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPostedWithin(option.value as PostedWithin)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                          postedWithin === option.value
                            ? "border-[rgb(var(--brand-accent))] bg-[rgba(var(--brand-accent),0.10)] text-[#5d3127]"
                            : "border-[#eadccf] bg-white text-[#6d4037] hover:bg-[#fff5ee]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8a736b]">
                    Selling terms
                  </h3>
                  <div className="mt-3">
                    <FilterCheckbox
                      label="Negotiable only"
                      checked={negotiableOnly}
                      onChange={setNegotiableOnly}
                    />
                  </div>
                </section>
              </div>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            {loadingListings ? (
              <div className="rounded-[1.8rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-12 text-center text-sm text-[#8a736b] shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
                Loading search results…
              </div>
            ) : listingsError ? (
              <div className="rounded-[1.8rem] border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.10)] px-6 py-5 text-sm text-[rgb(var(--brand-primary))]">
                Failed to load listings: {listingsError}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="rounded-[1.8rem] border border-[#eadccf] bg-[#fffaf6] px-6 py-12 text-center shadow-[0_12px_30px_rgba(75,36,28,0.05)]">
                <p className="text-lg font-semibold text-[#2a1714]">No results found</p>
                <p className="mt-2 text-sm leading-6 text-[#745f59]">
                  {searchQuery
                    ? `Nothing matched "${searchQuery}" with the filters you selected.`
                    : "There are no listings that match the current filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    location={item.location}
                    price={`$${item.price}`}
                    image={item.image}
                    initialLiked={savedIds.has(item.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

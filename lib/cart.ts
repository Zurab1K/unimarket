import { DEFAULT_IMAGE_SRC } from "@/lib/imageSources";
import type { ListingRecord } from "@/lib/supabaseData";

export const CART_STORAGE_KEY = "unimarket-cart";

export type CartItem = {
  id: number;
  sellerId: string;
  title: string;
  price: number;
  image: string;
  location: string | null;
  quantity: number;
  status: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readCart(): CartItem[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addListingToCart(listing: ListingRecord): CartItem[] {
  const current = readCart();
  const existing = current.find((item) => item.id === listing.id);

  if (existing) {
    const next = current.map((item) =>
      item.id === listing.id
        ? { ...item, quantity: item.quantity + 1 }
        : item,
    );
    writeCart(next);
    return next;
  }

  const next = [
    ...current,
    {
      id: listing.id,
      sellerId: listing.sellerId,
      title: listing.title,
      price: listing.price,
      image: listing.images[0] ?? DEFAULT_IMAGE_SRC,
      location: listing.location,
      quantity: 1,
      status: listing.status,
    },
  ];

  writeCart(next);
  return next;
}

export function removeCartItem(listingId: number): CartItem[] {
  const next = readCart().filter((item) => item.id !== listingId);
  writeCart(next);
  return next;
}

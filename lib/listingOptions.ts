export const LISTING_CATEGORIES = [
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "Dorm Essentials",
  "Sports & Outdoors",
  "Transportation",
  "Other",
] as const;

export const LISTING_CONDITIONS = [
  { label: "New", value: "new" },
  { label: "Like New", value: "like-new" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
  { label: "Poor", value: "poor" },
] as const;

export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  LISTING_CONDITIONS.map((condition) => [condition.value, condition.label]),
);

export type CampusZone = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export const CAMPUS_ZONES: CampusZone[] = [
  { id: "north-campus", label: "North Campus", lat: 37.4296, lng: -122.1697 },
  { id: "main-library", label: "Main Library", lat: 37.4275, lng: -122.1697 },
  { id: "student-center", label: "Student Center", lat: 37.4241, lng: -122.1704 },
  { id: "engineering-quad", label: "Engineering Quad", lat: 37.4277, lng: -122.1743 },
  { id: "south-campus", label: "South Campus", lat: 37.4219, lng: -122.1723 },
];

export const DEFAULT_MAP_CENTER: [number, number] = [
  CAMPUS_ZONES[1].lat,
  CAMPUS_ZONES[1].lng,
];

const LOCATION_PATTERN =
  /^(?<label>.*?)\s*(?:\((?<lat>-?\d+(?:\.\d+)?),\s*(?<lng>-?\d+(?:\.\d+)?)\))?$/;

export function formatLocationText(label: string, lat?: number, lng?: number) {
  const cleanLabel = label.trim();
  if (typeof lat !== "number" || typeof lng !== "number") return cleanLabel;
  return `${cleanLabel} (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

export function parseLocationText(location: string | null | undefined): {
  label: string;
  lat: number | null;
  lng: number | null;
} {
  const raw = location?.trim() ?? "";
  if (!raw) return { label: "", lat: null, lng: null };

  const match = raw.match(LOCATION_PATTERN);
  if (!match?.groups) return { label: raw, lat: null, lng: null };

  const label = match.groups.label?.trim() ?? raw;
  const lat = match.groups.lat ? Number(match.groups.lat) : null;
  const lng = match.groups.lng ? Number(match.groups.lng) : null;

  if (
    lat === null ||
    lng === null ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return { label, lat: null, lng: null };
  }

  return { label, lat, lng };
}

export function getZoneByLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  return CAMPUS_ZONES.find((zone) => zone.label.toLowerCase() === normalized) ?? null;
}

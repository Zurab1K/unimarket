export type CampusZone = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type MeetupPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  isCustom?: boolean;
};

export const CAMPUS_ZONES: CampusZone[] = [
  { id: "staller-center", label: "Staller Center", lat: 40.9153, lng: -73.1222 },
  { id: "melville-library", label: "Melville Library", lat: 40.9160, lng: -73.1232 },
  { id: "student-activities-center", label: "Student Activities Center", lat: 40.9174, lng: -73.1208 },
  { id: "engineering-building", label: "Engineering Building", lat: 40.9123, lng: -73.1238 },
  { id: "west-side-dining", label: "West Side Dining", lat: 40.9145, lng: -73.1272 },
];

export const DEFAULT_MAP_CENTER: [number, number] = [
  CAMPUS_ZONES[1].lat,
  CAMPUS_ZONES[1].lng,
];

const LOCATION_PATTERN =
  /^(?<label>.*?)\s*(?:\((?<lat>-?\d+(?:\.\d+)?),\s*(?<lng>-?\d+(?:\.\d+)?)\))?$/;
const MULTI_PREFIX = "MULTI_MEETUP::";

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

export function getLocationDisplayLabel(location: string | null | undefined) {
  const points = parseMeetupPoints(location);
  return points[0]?.label || "Campus meetup";
}

export function serializeMeetupPoints(points: MeetupPoint[]) {
  if (points.length === 0) return "";
  const compact = points.map((point) => ({
    id: point.id,
    label: point.label.trim(),
    lat: Number(point.lat.toFixed(5)),
    lng: Number(point.lng.toFixed(5)),
    isCustom: Boolean(point.isCustom),
  }));
  return `${MULTI_PREFIX}${encodeURIComponent(JSON.stringify(compact))}`;
}

function normalizeMeetupPoint(raw: unknown): MeetupPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const point = raw as Partial<MeetupPoint>;
  if (
    typeof point.id !== "string" ||
    typeof point.label !== "string" ||
    typeof point.lat !== "number" ||
    typeof point.lng !== "number"
  ) {
    return null;
  }
  if (
    Number.isNaN(point.lat) ||
    Number.isNaN(point.lng) ||
    Math.abs(point.lat) > 90 ||
    Math.abs(point.lng) > 180
  ) {
    return null;
  }
  return {
    id: point.id,
    label: point.label.trim(),
    lat: point.lat,
    lng: point.lng,
    isCustom: Boolean(point.isCustom),
  };
}

export function parseMeetupPoints(location: string | null | undefined): MeetupPoint[] {
  const raw = location?.trim() ?? "";
  if (!raw) return [];

  if (raw.startsWith(MULTI_PREFIX)) {
    try {
      const payload = raw.slice(MULTI_PREFIX.length);
      const decoded = decodeURIComponent(payload);
      const parsed = JSON.parse(decoded) as unknown[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeMeetupPoint).filter(Boolean) as MeetupPoint[];
    } catch {
      return [];
    }
  }

  const parsedSingle = parseLocationText(raw);
  if (!parsedSingle.label) return [];

  if (parsedSingle.lat !== null && parsedSingle.lng !== null) {
    return [
      {
        id: "meetup-primary",
        label: parsedSingle.label,
        lat: parsedSingle.lat,
        lng: parsedSingle.lng,
      },
    ];
  }

  const zone = getZoneByLabel(parsedSingle.label);
  if (zone) {
    return [
      {
        id: zone.id,
        label: zone.label,
        lat: zone.lat,
        lng: zone.lng,
      },
    ];
  }

  return [
    {
      id: "meetup-primary",
      label: parsedSingle.label,
      lat: DEFAULT_MAP_CENTER[0],
      lng: DEFAULT_MAP_CENTER[1],
      isCustom: true,
    },
  ];
}

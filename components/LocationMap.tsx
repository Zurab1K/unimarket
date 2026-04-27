"use client";

import dynamic from "next/dynamic";
import { DEFAULT_MAP_CENTER } from "@/lib/location";

const InteractiveLocationMap = dynamic(
  () => import("@/components/InteractiveLocationMap"),
  { ssr: false },
);

export default function LocationMap({
  center = DEFAULT_MAP_CENTER,
  marker = null,
  markers = [],
  selectedMarkerIds = [],
  onPick,
  onMarkerSelect,
  readOnly = false,
}: {
  center?: [number, number];
  marker?: [number, number] | null;
  markers?: Array<{ id: string; label: string; lat: number; lng: number }>;
  selectedMarkerIds?: string[];
  onPick?: (lat: number, lng: number) => void;
  onMarkerSelect?: (id: string) => void;
  readOnly?: boolean;
}) {
  return (
    <InteractiveLocationMap
      center={center}
      marker={marker}
      markers={markers}
      selectedMarkerIds={selectedMarkerIds}
      onPick={onPick}
      onMarkerSelect={onMarkerSelect}
      readOnly={readOnly}
    />
  );
}

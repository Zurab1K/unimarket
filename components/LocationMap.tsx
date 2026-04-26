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
  onPick,
  readOnly = false,
}: {
  center?: [number, number];
  marker?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  return (
    <InteractiveLocationMap
      center={center}
      marker={marker}
      onPick={onPick}
      readOnly={readOnly}
    />
  );
}

"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function InteractiveLocationMap({
  center,
  marker,
  onPick,
  readOnly = false,
}: {
  center: [number, number];
  marker: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  const currentCenter = useMemo<[number, number]>(() => center, [center]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e0cfc6]">
      <MapContainer
        center={currentCenter}
        zoom={15}
        scrollWheelZoom
        className="h-64 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && onPick && <ClickHandler onPick={onPick} />}
        {marker && <Marker position={marker} icon={markerIcon} />}
      </MapContainer>
    </div>
  );
}

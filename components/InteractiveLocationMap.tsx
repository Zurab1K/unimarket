"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const markerShadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const blueMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redMarkerIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadowUrl,
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
  markers = [],
  selectedMarkerIds = [],
  onPick,
  onMarkerSelect,
  readOnly = false,
}: {
  center: [number, number];
  marker: [number, number] | null;
  markers?: Array<{ id: string; label: string; lat: number; lng: number }>;
  selectedMarkerIds?: string[];
  onPick?: (lat: number, lng: number) => void;
  onMarkerSelect?: (id: string) => void;
  readOnly?: boolean;
}) {
  const currentCenter = useMemo<[number, number]>(() => center, [center]);
  const selectedSet = useMemo(
    () => new Set(selectedMarkerIds),
    [selectedMarkerIds],
  );

  return (
    <div className="relative z-0 overflow-hidden rounded-2xl border border-[#e0cfc6]">
      <MapContainer
        center={currentCenter}
        zoom={15}
        scrollWheelZoom
        className="z-0 h-64 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={selectedSet.has(point.id) ? redMarkerIcon : blueMarkerIcon}
            eventHandlers={
              onMarkerSelect
                ? {
                    click: () => onMarkerSelect(point.id),
                  }
                : undefined
            }
          >
            <Popup>{point.label}</Popup>
          </Marker>
        ))}
        {!readOnly && onPick && <ClickHandler onPick={onPick} />}
        {marker && <Marker position={marker} icon={redMarkerIcon} />}
      </MapContainer>
    </div>
  );
}

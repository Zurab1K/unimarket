"use client";

import { useEffect, useRef, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import {
  createListing,
  updateListing,
  uploadListingImages,
  type ListingInput,
  type ListingRecord,
} from "@/lib/supabaseData";
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/lib/listingOptions";
import LocationMap from "@/components/LocationMap";
import {
  CAMPUS_ZONES,
  DEFAULT_MAP_CENTER,
  isSerializedMeetupLocation,
  parseMeetupPoints,
  serializeMeetupPoints,
  type MeetupPoint,
} from "@/lib/location";

interface ListingFormModalProps {
  listing?: ListingRecord | null;
  onClose: () => void;
  onSaved: (listing: ListingRecord) => void;
}

const EMPTY_FORM: ListingInput = {
  title: "",
  description: "",
  price: 0,
  category: "Other",
  condition: "good",
  location: "",
  images: [],
  isNegotiable: false,
  status: "available",
};

export default function ListingFormModal({
  listing,
  onClose,
  onSaved,
}: ListingFormModalProps) {
  const isEdit = Boolean(listing);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rawInitialLocation = listing?.location ?? "";
  const parsedInitialMeetupPoints = parseMeetupPoints(rawInitialLocation);
  const initialMeetupPoints =
    isSerializedMeetupLocation(rawInitialLocation) ||
    parsedInitialMeetupPoints.some((point) => !point.isCustom)
      ? parsedInitialMeetupPoints
      : [];
  const initialLocationText =
    initialMeetupPoints.length > 0
      ? initialMeetupPoints.map((point) => point.label).join(", ")
      : rawInitialLocation;

  const [form, setForm] = useState<ListingInput>(
    listing
      ? {
          title: listing.title,
          description: listing.description ?? "",
          price: listing.price,
          category: listing.category,
          condition: listing.condition ?? "good",
          location: initialLocationText,
          images: listing.images,
          isNegotiable: listing.isNegotiable,
          status: listing.status,
        }
      : EMPTY_FORM,
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zoneIdSet = new Set(CAMPUS_ZONES.map((zone) => zone.id));
  const [customMeetupPoints, setCustomMeetupPoints] = useState<MeetupPoint[]>(
    initialMeetupPoints.filter((point) => point.isCustom || !zoneIdSet.has(point.id)),
  );
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>(
    initialMeetupPoints.map((point) => point.id),
  );
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(
    initialMeetupPoints[0]
      ? [initialMeetupPoints[0].lat, initialMeetupPoints[0].lng]
      : null,
  );
  const [customPointName, setCustomPointName] = useState("");
  const [pendingCustomCoords, setPendingCustomCoords] = useState<[number, number] | null>(null);
  const allMeetupMarkers: MeetupPoint[] = [
    ...CAMPUS_ZONES,
    ...customMeetupPoints,
  ];
  const selectedMeetupPoints = allMeetupMarkers.filter((point) =>
    selectedPointIds.includes(point.id),
  );

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleUpload(files: File[]): Promise<string[]> {
    const result = await uploadListingImages(files);
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (form.price < 0) {
      setError("Price cannot be negative.");
      return;
    }

    const payload: ListingInput = {
      ...form,
      location:
        selectedMeetupPoints.length > 0
          ? serializeMeetupPoints(selectedMeetupPoints)
          : form.location.trim(),
    };

    setSaving(true);
    setError(null);

    const result =
      isEdit && listing
        ? await updateListing(listing.id, payload)
        : await createListing(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (result.data) onSaved(result.data);
  }

  function handleZoneToggle(zoneId: string) {
    const zone = CAMPUS_ZONES.find((item) => item.id === zoneId);
    if (!zone) return;
    setSelectedPointIds((current) => {
      if (current.includes(zone.id)) {
        const next = current.filter((id) => id !== zone.id);
        const first = allMeetupMarkers.find((point) => next.includes(point.id));
        setSelectedPoint(first ? [first.lat, first.lng] : null);
        return next;
      }
      setSelectedPoint([zone.lat, zone.lng]);
      return [...current, zone.id];
    });
  }

  function handleMarkerToggle(markerId: string) {
    const marker = allMeetupMarkers.find((point) => point.id === markerId);
    if (!marker) return;
    setSelectedPointIds((current) => {
      if (current.includes(markerId)) {
        const next = current.filter((id) => id !== markerId);
        const first = allMeetupMarkers.find((point) => next.includes(point.id));
        setSelectedPoint(first ? [first.lat, first.lng] : null);
        return next;
      }
      setSelectedPoint([marker.lat, marker.lng]);
      return [...current, markerId];
    });
  }

  function handleMapPick(lat: number, lng: number) {
    setSelectedPoint([lat, lng]);
    setPendingCustomCoords([lat, lng]);
  }

  function addCustomPoint() {
    if (!pendingCustomCoords || !customPointName.trim()) return;
    const id = `custom-${Date.now()}`;
    setCustomMeetupPoints((current) => [
      ...current,
      {
        id,
        label: customPointName.trim(),
        lat: pendingCustomCoords[0],
        lng: pendingCustomCoords[1],
        isCustom: true,
      },
    ]);
    setSelectedPointIds((current) => [...current, id]);
    setCustomPointName("");
    setPendingCustomCoords(null);
  }

  function removeMeetupPoint(id: string) {
    if (zoneIdSet.has(id)) {
      setSelectedPointIds((current) => current.filter((pointId) => pointId !== id));
      return;
    }
    setCustomMeetupPoints((current) => current.filter((point) => point.id !== id));
    setSelectedPointIds((current) => current.filter((pointId) => pointId !== id));
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#eadccf] bg-[#fffaf6] shadow-[0_32px_80px_rgba(63,27,21,0.18)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eadccf] px-6 py-5">
          <h2 className="text-xl font-semibold text-[#2a1714]">
            {isEdit ? "Edit listing" : "New listing"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1e4dc] text-[#6d4037] transition hover:bg-[#e8d3c8]"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex max-h-[72vh] flex-col gap-5 overflow-y-auto px-6 py-6">
          {/* Images */}
          <Field label="Photos">
            <ImageUploader
              existingUrls={form.images}
              onChange={(urls) => setForm((f) => ({ ...f, images: urls }))}
              onFilesSelected={handleUpload}
              disabled={saving}
            />
          </Field>

          {/* Title */}
          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Calculus textbook"
              disabled={saving}
              className="input"
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Condition details, edition, what's included…"
              disabled={saving}
              className="input resize-none"
            />
          </Field>

          {/* Category + Condition */}
          <div className="flex gap-4">
            <Field label="Category" className="flex-1">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                disabled={saving}
                className="input"
              >
                {LISTING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Condition" className="flex-1">
              <select
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                disabled={saving}
                className="input"
              >
                {LISTING_CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Price + Location */}
          <div className="flex gap-4">
            <Field label="Price ($)" className="flex-1">
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price === 0 ? "" : form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
                disabled={saving}
                className="input"
              />
            </Field>
            <Field label="Location" className="flex-1">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. North campus"
                disabled={saving}
                className="input"
              />
            </Field>
          </div>

          <Field label="Meetup map">
            <div className="space-y-3">
              <p className="text-xs text-[#8a736b]">
                Pick one or more campus zones, or click the map to add a custom meetup point.
              </p>
              <div className="flex flex-wrap gap-2">
                {CAMPUS_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleZoneToggle(zone.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedPointIds.includes(zone.id)
                        ? "border-[rgb(var(--brand-accent))] bg-[rgba(var(--brand-accent),0.14)] text-[#5d3127]"
                        : "border-[#e0cfc6] bg-[#faf5f2] text-[#6d4037] hover:bg-[#f1e4dc]"
                    }`}
                  >
                    {zone.label}
                  </button>
                ))}
              </div>
              <LocationMap
                center={
                  selectedPoint ?? DEFAULT_MAP_CENTER
                }
                marker={selectedPoint}
                markers={allMeetupMarkers}
                selectedMarkerIds={selectedPointIds}
                onMarkerSelect={handleMarkerToggle}
                onPick={handleMapPick}
              />
              <div className="flex flex-col gap-2 rounded-xl border border-[#e0cfc6] bg-[#faf5f2] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a736b]">
                  Add custom meetup point
                </p>
                <p className="text-xs text-[#8a736b]">
                  Click on the map, then name that custom point.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPointName}
                    onChange={(event) => setCustomPointName(event.target.value)}
                    placeholder="e.g. Union bus stop entrance"
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={addCustomPoint}
                    disabled={!pendingCustomCoords || !customPointName.trim()}
                    className="rounded-full bg-[rgb(var(--brand-accent))] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Add point
                  </button>
                </div>
              </div>
              {selectedMeetupPoints.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMeetupPoints.map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => removeMeetupPoint(point.id)}
                      className="rounded-full border border-[#e0cfc6] bg-white px-3 py-1.5 text-xs font-semibold text-[#6d4037] transition hover:bg-[#f1e4dc]"
                    >
                      {point.label} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Negotiable + Status row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Negotiable toggle */}
            <label className="flex cursor-pointer items-center gap-2.5 select-none">
              <span className="text-sm text-[#4a2e27]">Price is negotiable</span>
              <button
                type="button"
                role="switch"
                aria-checked={form.isNegotiable}
                onClick={() => setForm((f) => ({ ...f, isNegotiable: !f.isNegotiable }))}
                disabled={saving}
                className={[
                  "relative h-6 w-11 rounded-full border transition-colors duration-200",
                  form.isNegotiable
                    ? "border-[rgb(var(--brand-accent))] bg-[rgb(var(--brand-accent))]"
                    : "border-[#d0bfb8] bg-[#ede4de]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                    form.isNegotiable ? "translate-x-5" : "translate-x-0.5",
                  ].join(" ")}
                />
              </button>
            </label>

            {/* Status (edit mode only) */}
            {isEdit && (
              <Field label="Status" className="ml-auto">
                <select
                  value={form.status ?? "available"}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={saving}
                  className="input"
                >
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                </select>
              </Field>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-[rgba(var(--brand-primary),0.18)] bg-[rgba(var(--brand-accent),0.12)] px-4 py-3 text-sm text-[rgb(var(--brand-primary))]">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#eadccf] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-[#e0cfc6] bg-transparent px-5 py-2.5 text-sm font-medium text-[#6d4037] transition hover:bg-[#f1e4dc] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full bg-[rgb(var(--brand-accent))] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 active:scale-[0.97] disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Post listing"}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.875rem;
          border: 1px solid #e0cfc6;
          background: #faf5f2;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          color: #2a1714;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input::placeholder { color: #a48e87; }
        .input:focus { border-color: rgb(var(--brand-accent)); box-shadow: 0 0 0 3px rgba(var(--brand-accent),0.15); }
        .input:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-widest text-[#a06050]">
        {label}
      </label>
      {children}
    </div>
  );
}

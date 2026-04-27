"use client";

import { useEffect, useRef, useState } from "react";

interface ImageUploaderProps {
  /** Already-uploaded public URLs (from Supabase Storage) */
  existingUrls?: string[];
  /** Called whenever the final URL list changes */
  onChange: (urls: string[]) => void;
  /** Called with raw File objects so the parent can upload them */
  onFilesSelected: (files: File[]) => Promise<string[]>;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  existingUrls = [],
  onChange,
  onFilesSelected,
  maxImages = 5,
  disabled = false,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.clear();
    };
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (uploading) return;

    const remaining = maxImages - previews.length;
    if (remaining <= 0) return;

    const selected = Array.from(files).slice(0, remaining);
    const previousPreviews = previews;

    // Show local blob previews immediately
    const localUrls = selected.map((file) => {
      const url = URL.createObjectURL(file);
      blobUrlsRef.current.add(url);
      return url;
    });
    const withBlobs = [...previousPreviews, ...localUrls];
    setPreviews(withBlobs);

    setUploading(true);
    try {
      const uploaded = await onFilesSelected(selected);
      // Swap each blob URL out for its real Supabase URL
      const withReal = withBlobs.map((url) => {
        const uploadIndex = localUrls.indexOf(url);
        return uploadIndex >= 0 && uploaded[uploadIndex] ? uploaded[uploadIndex] : url;
      });
      // Revoke blob URLs to free memory
      localUrls.forEach((url) => {
        URL.revokeObjectURL(url);
        blobUrlsRef.current.delete(url);
      });
      setPreviews(withReal);
      onChange(withReal);
    } catch (error) {
      // Rollback to state before this upload attempt
      localUrls.forEach((url) => {
        URL.revokeObjectURL(url);
        blobUrlsRef.current.delete(url);
      });
      setPreviews(previousPreviews);
      onChange(previousPreviews);
      console.error("Image upload failed:", error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const url = previews[index];
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }
    const next = previews.filter((_, i) => i !== index);
    setPreviews(next);
    onChange(next);
  }

  const dropDisabled = disabled || uploading || previews.length >= maxImages;

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone */}
      <button
        type="button"
        disabled={dropDisabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          if (dropDisabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (dropDisabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          "flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all duration-200",
          dragOver
            ? "border-[rgb(var(--brand-accent))] bg-[rgba(var(--brand-accent),0.14)]"
            : "border-[#e0cfc6] bg-[#faf5f2] hover:border-[#c47a5e] hover:bg-[#fdf1ec]",
          dropDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 text-[rgb(var(--brand-primary))]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm text-[#7c5e57]">
          {uploading
            ? "Uploading…"
            : previews.length >= maxImages
            ? `Max ${maxImages} images reached`
            : "Drop images here or click to select"}
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((url, i) => {
            const isBlob = url.startsWith("blob:");
            return (
              <div
                key={url}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#e0cfc6] shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className={[
                    "h-full w-full object-cover transition-opacity",
                    isBlob && uploading ? "opacity-60" : "opacity-100",
                  ].join(" ")}
                />
                {isBlob && uploading && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  </div>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

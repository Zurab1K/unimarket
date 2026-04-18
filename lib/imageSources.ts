export const DEFAULT_IMAGE_SRC = "/placeholder-avatar-picture.jpg";

const KNOWN_LOCAL_IMAGE_PATHS = new Set([
  DEFAULT_IMAGE_SRC,
  "/heart.png",
  "/heartfilled.png",
  "/ipad.jpg",
  "/laptop.jpg",
]);

function isExternalImageSrc(src: string): boolean {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

export function resolveImageSrc(
  src: string | null | undefined,
  fallbackSrc: string = DEFAULT_IMAGE_SRC,
): string {
  const trimmed = src?.trim();
  if (!trimmed) return fallbackSrc;
  if (isExternalImageSrc(trimmed)) return trimmed;

  if (trimmed.startsWith("/")) {
    return KNOWN_LOCAL_IMAGE_PATHS.has(trimmed) ? trimmed : fallbackSrc;
  }

  return fallbackSrc;
}

export function normalizeImageList(images: unknown): string[] {
  const rawImages = Array.isArray(images)
    ? images
    : typeof images === "string" && images.length > 0
      ? [images]
      : [];

  const normalized = rawImages.flatMap((image) => {
    if (typeof image !== "string") return [];

    const resolved = resolveImageSrc(image, "");
    return resolved ? [resolved] : [];
  });

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [DEFAULT_IMAGE_SRC];
}

export const DEFAULT_IMAGE_SRC = "/placeholder-avatar-picture.jpg";

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
    return trimmed;
  }

  return fallbackSrc;
}

export function normalizeImageList(images: unknown): string[] {
  let rawImages: unknown[] = [];

  if (Array.isArray(images)) {
    rawImages = images;
  } else if (typeof images === "string") {
    const trimmed = images.trim();

    if (trimmed.length > 0) {
      try {
        const parsed = JSON.parse(trimmed);
        rawImages = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rawImages = [trimmed];
      }
    }
  }

  const normalized = rawImages.flatMap((image) => {
    if (typeof image !== "string") return [];

    const resolved = resolveImageSrc(image, "");
    return resolved ? [resolved] : [];
  });

  return normalized.length > 0
    ? Array.from(new Set(normalized))
    : [DEFAULT_IMAGE_SRC];
}

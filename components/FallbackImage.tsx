"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { DEFAULT_IMAGE_SRC, resolveImageSrc } from "@/lib/imageSources";

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
  fallbackSrc?: string;
};

export default function FallbackImage({
  src,
  alt,
  fallbackSrc = DEFAULT_IMAGE_SRC,
  onError,
  ...props
}: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() =>
    resolveImageSrc(src, fallbackSrc),
  );

  useEffect(() => {
    setCurrentSrc(resolveImageSrc(src, fallbackSrc));
  }, [fallbackSrc, src]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}

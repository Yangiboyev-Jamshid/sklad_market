import { useState } from "react";

export default function SafeImage({ src, alt = "", className, fallback = null, loading = "lazy", ...props }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  const broken = brokenSrc === src;

  if (!src || broken) {
    return fallback;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setBrokenSrc(src)}
      className={className}
      {...props}
    />
  );
}

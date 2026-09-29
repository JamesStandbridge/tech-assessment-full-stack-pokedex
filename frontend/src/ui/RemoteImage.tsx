import { type JSX, useState } from "react";

interface RemoteImageProps {
  readonly src: string | null;
  readonly alt: string;
  /** Rendered width and height in pixels, declared so the layout does not shift. */
  readonly size: number;
  /** Load at once, for an image above the fold. */
  readonly eager?: boolean;
}

/** An image from another host, replaced by a placeholder when it is missing or fails. */
export function RemoteImage({ src, alt, size, eager = false }: RemoteImageProps): JSX.Element {
  const [failed, setFailed] = useState<string | null>(null);
  if (src === null || failed === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} (image unavailable)`}
        className="bg-panel-raised text-muted grid place-items-center rounded-full"
        style={{ width: size, height: size }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-1/2" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 12h6m6 0h6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className="object-contain"
      onError={() => {
        setFailed(src);
      }}
    />
  );
}

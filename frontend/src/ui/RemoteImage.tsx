import { type JSX, useState } from "react";

interface RemoteImageProps {
  readonly src: string | null;
  readonly alt: string;
  /** Rendered width and height in pixels, declared so the layout does not shift. */
  readonly size: number;
  /** Load at once, for an image above the fold. */
  readonly eager?: boolean;
  /** Extra classes, such as a print treatment of the image. */
  readonly className?: string;
  /** Called once the image has loaded, for decorations drawn over it. */
  readonly onLoad?: (image: HTMLImageElement) => void;
}

/** An image from another host, replaced by a placeholder when it is missing or fails. */
export function RemoteImage(props: RemoteImageProps): JSX.Element {
  const { src, alt, size, eager = false, className = "", onLoad } = props;
  const [failed, setFailed] = useState<string | null>(null);
  if (src === null || failed === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} (image unavailable)`}
        className="border-rule text-rule-strong grid place-items-center border border-dashed"
        style={{ width: size, height: size }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-1/3" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" />
          <path d="M3 12h6m6 0h6" stroke="currentColor" strokeWidth="1" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1" />
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
      crossOrigin="anonymous"
      className={`object-contain ${className}`}
      onLoad={(event) => onLoad?.(event.currentTarget)}
      onError={() => {
        setFailed(src);
      }}
    />
  );
}

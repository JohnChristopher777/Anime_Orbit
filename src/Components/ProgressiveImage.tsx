import React, { useEffect, useState } from "react";

interface ProgressiveImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  wrapperClassName?: string;
  fallbackSrc?: string;
}

/** Shared image surface with stable layout, a lightweight skeleton and local fallback art. */
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  fallbackSrc = "/lost.jpg",
  loading = "lazy",
  decoding = "async",
  srcSet,
  sizes,
  onLoad,
  onError,
  ...props
}) => {
  const [resolvedSrc, setResolvedSrc] = useState(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [usingFallback, setUsingFallback] = useState(!src);

  useEffect(() => {
    setResolvedSrc(src || fallbackSrc);
    setUsingFallback(!src);
    setIsLoading(Boolean(src));
  }, [src, fallbackSrc]);

  return (
    <span className={`progressive-image ${usingFallback ? "progressive-image--fallback" : ""} ${wrapperClassName}`}>
      {isLoading && <span className="image-skeleton" aria-hidden="true" />}
      <img
        {...props}
        src={resolvedSrc}
        srcSet={usingFallback ? undefined : srcSet}
        sizes={usingFallback ? undefined : sizes}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={(event) => {
          setIsLoading(false);
          onLoad?.(event);
        }}
        onError={(event) => {
          if (resolvedSrc !== fallbackSrc) {
            setResolvedSrc(fallbackSrc);
            setUsingFallback(true);
            setIsLoading(true);
          } else {
            setIsLoading(false);
          }
          onError?.(event);
        }}
      />
    </span>
  );
};

export default ProgressiveImage;

import React, { useEffect, useRef, useState } from "react";

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
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setResolvedSrc(src || fallbackSrc);
    setUsingFallback(!src);
    setIsLoading(Boolean(src));
  }, [src, fallbackSrc]);

  useEffect(() => {
    if (!isLoading) return;
    const image = imageRef.current;
    if (image?.complete) {
      if (image.naturalWidth > 0) setIsLoading(false);
      else if (resolvedSrc !== fallbackSrc) {
        setResolvedSrc(fallbackSrc);
        setUsingFallback(true);
      } else setIsLoading(false);
      return;
    }
    const timeout = window.setTimeout(() => {
      if (resolvedSrc !== fallbackSrc) {
        setResolvedSrc(fallbackSrc);
        setUsingFallback(true);
      } else {
        setIsLoading(false);
      }
    }, usingFallback ? 4500 : 12000);
    return () => window.clearTimeout(timeout);
  }, [fallbackSrc, isLoading, resolvedSrc, usingFallback]);

  return (
    <span className={`progressive-image ${usingFallback ? "progressive-image--fallback" : ""} ${wrapperClassName}`}>
      {isLoading && <span className="image-skeleton" aria-hidden="true" />}
      <img
        ref={(node) => {
          imageRef.current = node;
          if (node?.complete && node.naturalWidth > 0) setIsLoading(false);
        }}
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

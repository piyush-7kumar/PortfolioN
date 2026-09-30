"use client";

import Image, { getImageProps, type ImageProps, type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * A below-the-fold image that starts loading after the page has hydrated and
 * only once it's within a screen of the viewport, so screenshots never
 * compete with the fonts and HTML for the first paint. Until then the frame
 * shows the image's own blurred placeholder at the final size.
 */
export function DeferredImage({
  id,
  src,
  alt,
  ...rest
}: Omit<ImageProps, "src" | "placeholder" | "loading"> & { src: StaticImageData }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { props: fallback } = getImageProps({ src, alt, ...rest });

  return (
    <span ref={ref} id={id} className="deferred-image">
      {src.blurDataURL ? (
        <span aria-hidden="true" className="deferred-blur" style={{ backgroundImage: `url(${src.blurDataURL})` }} />
      ) : null}
      {near ? (
        <Image src={src} alt={alt} {...rest} />
      ) : (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img {...fallback} />
        </noscript>
      )}
    </span>
  );
}

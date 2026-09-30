import Image, { type StaticImageData } from "next/image";
import { ViewTransition } from "react";

import { DeferredImage } from "./deferred-image";
import { GlassSpec } from "./glass";

/** A glass browser window around a project screenshot. */
export function BrowserFrame({
  slug,
  url,
  image,
  alt,
  sizes,
  eager = false,
  className = "",
}: {
  slug: string;
  url: string;
  image: StaticImageData;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  return (
    <ViewTransition name={`shot-${slug}`} share="morph" default="none">
      <figure className={`frame glass ${className}`} data-glass>
        <GlassSpec />
        <div className="frame-bar" aria-hidden="true">
          <span className="frame-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="frame-address">{url}</span>
        </div>
        <div className="frame-shot">
          {eager ? (
            <Image src={image} alt={alt} sizes={sizes} quality={85} placeholder="blur" preload fetchPriority="high" />
          ) : (
            <DeferredImage src={image} alt={alt} sizes={sizes} quality={85} />
          )}
        </div>
      </figure>
    </ViewTransition>
  );
}

/** The Source-layer twin of a browser frame: the request line in place of the address bar. */
export function FrameSource({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center gap-3 px-4 text-[13px] max-sm:h-8 max-sm:text-[11px]">
        <span className="tk-k">GET</span>
        <span className="min-w-0 truncate">
          <span className="tk-d">https://</span>
          {url}
        </span>
        <span className="tk-n ml-auto">200</span>
      </div>
      <div className="relative aspect-[16/10] min-h-0">{children}</div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ArchitecturalImage — Editorial image component with blueprint fallback
//
// Supports subtle personal photography and project interface captures.
// If the target image does not exist on disk, gracefully displays a neutral
// architectural blueprint schematic without broken image icons or layout shifts.
// ─────────────────────────────────────────────────────────────────────────────

interface ArchitecturalImageProps {
  src: string;
  alt: string;
  type?: "profile" | "project";
  caption?: string;
  expectedPath?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/2";
  className?: string;
}

export function ArchitecturalImage({
  src,
  alt,
  type = "project",
  caption,
  expectedPath,
  aspectRatio = type === "profile" ? "1/1" : "16/9",
  className = "",
}: ArchitecturalImageProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "fallback">("loading");

  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (active) setImageState("loaded");
    };
    img.onerror = () => {
      if (active) setImageState("fallback");
    };
    return () => {
      active = false;
    };
  }, [src]);

  const aspectClass =
    aspectRatio === "1/1"
      ? "aspect-square"
      : aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : aspectRatio === "3/2"
      ? "aspect-[3/2]"
      : "aspect-[16/9]";

  // When image successfully loaded
  if (imageState === "loaded") {
    return (
      <figure className={`overflow-hidden border border-[var(--border)] bg-[var(--surface-muted)] ${className}`}>
        <div className={`relative w-full ${aspectClass} overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>
        {caption && (
          <figcaption className="border-t border-[var(--border)] px-2.5 py-1 font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase bg-[var(--surface)] flex justify-between">
            <span>FIGURE: {caption}</span>
            <span className="text-[var(--border-strong)]">VERIFIED ASSET</span>
          </figcaption>
        )}
      </figure>
    );
  }

  // Graceful neutral architectural fallback (when file is not yet deployed)
  if (type === "profile") {
    return (
      <div
        className={`relative ${aspectClass} border border-[var(--border)] bg-[var(--surface-muted)] flex flex-col items-center justify-center p-2 text-center select-none overflow-hidden ${className}`}
        title={`Asset target: ${expectedPath ?? "public/images/profile.jpg"}`}
        aria-label="Profile photography placeholder"
      >
        {/* Architectural corner registration marks */}
        <span className="absolute top-1 left-1 font-mono text-[8px] text-[var(--border-strong)] leading-none" aria-hidden="true">+</span>
        <span className="absolute top-1 right-1 font-mono text-[8px] text-[var(--border-strong)] leading-none" aria-hidden="true">+</span>
        <span className="absolute bottom-1 left-1 font-mono text-[8px] text-[var(--border-strong)] leading-none" aria-hidden="true">+</span>
        <span className="absolute bottom-1 right-1 font-mono text-[8px] text-[var(--border-strong)] leading-none" aria-hidden="true">+</span>

        {/* Monogram */}
        <div className="w-8 h-8 border border-[var(--border-strong)] flex items-center justify-center mb-1 bg-[var(--surface)]">
          <span className="font-mono text-xs font-bold tracking-[0.16em] text-[var(--foreground)]">
            SK
          </span>
        </div>

        <span className="font-mono text-[7px] tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
          PORTRAIT
        </span>
        <span className="font-mono text-[6px] tracking-[0.08em] text-[var(--border-strong)] uppercase truncate max-w-full px-1">
          {expectedPath ? expectedPath.replace("public/", "") : "profile.jpg"}
        </span>
      </div>
    );
  }

  // Project schematic blueprint fallback
  return (
    <div
      className={`relative ${aspectClass} border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden flex flex-col select-none ${className}`}
      title={`Asset target: ${expectedPath ?? "public/images/projects/<slug>.png"}`}
      aria-label={`${alt} schematic placeholder`}
    >
      {/* Background blueprint grid watermark */}
      <div className="absolute inset-0 blueprint-grid opacity-30 pointer-events-none" aria-hidden="true" />

      {/* Diagonal technical guide lines */}
      <svg className="absolute inset-0 w-full h-full stroke-[var(--border-subtle)] stroke-[0.5] pointer-events-none" aria-hidden="true">
        <line x1="0" y1="0" x2="100%" y2="100%" />
        <line x1="100%" y1="0" x2="0" y2="100%" />
      </svg>

      {/* Center technical badge */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 text-center z-10">
        <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 shadow-sm mb-1.5 max-w-[90%]">
          <p className="font-mono text-[8px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase">
            [ ARTIFACT SCHEMATIC ]
          </p>
          <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-[var(--foreground)] uppercase truncate">
            {caption || alt}
          </p>
        </div>
        <p className="font-mono text-[7px] tracking-[0.1em] text-[var(--border-strong)] uppercase">
          TARGET: {expectedPath ?? "public/images/projects/<slug>.png"}
        </p>
      </div>

      {/* Footer metadata bar */}
      <div className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[7px] tracking-[0.14em] text-[var(--border-strong)] uppercase flex justify-between">
        <span>ASSET SPEC: 16:9 PNG</span>
        <span>AWAITING CAPTURE</span>
      </div>
    </div>
  );
}

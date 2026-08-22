"use client";

import { forwardRef } from "react";

interface SystemButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  active?: boolean;
  children: React.ReactNode;
}

export const SystemButton = forwardRef<HTMLButtonElement, SystemButtonProps>(
  function SystemButton(
    { variant = "default", active = false, className = "", children, ...props },
    ref
  ) {
    const base =
      "inline-flex items-center justify-center gap-2 px-3.5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-40 disabled:pointer-events-none";

    const variants = {
      default: active
        ? "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--surface)] shadow-sm"
        : "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]",
      primary:
        "border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--surface)] hover:bg-[var(--foreground-muted)] hover:border-[var(--foreground-muted)]",
      ghost:
        "border border-transparent bg-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

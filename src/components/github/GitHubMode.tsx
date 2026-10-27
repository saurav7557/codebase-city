"use client";

import { useEffect, useRef, useState } from "react";
import { SystemButton } from "@/components/ui/SystemButton";

// ─────────────────────────────────────────────────────────────────────────────
// GitHubMode — Architectural GitHub Experience (04 GITHUB)
//
// Displays real GitHub repositories, languages, stars, and external links
// fetched via /api/github/repositories. Handles live synchronization,
// loading, empty, and offline/error states with transparent diagnostics.
// ─────────────────────────────────────────────────────────────────────────────

export interface GitHubRepoItem {
  externalId: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  primaryLanguage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  pushedAt: string | Date | null;
  isFork: boolean;
  isArchived: boolean;
}

interface GitHubModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubMode({ isOpen, onClose }: GitHubModeProps) {
  const [repositories, setRepositories] = useState<GitHubRepoItem[]>([]);
  const [username, setUsername] = useState<string>("saurav7557");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    async function loadRepositories() {
      try {
        const response = await fetch("/api/github/repositories");
        const data = await response.json();
        if (!isSubscribed) return;

        if (response.ok && data.repositories) {
          setRepositories(data.repositories);
          if (data.username) setUsername(data.username);
          setError(null);
          setErrorDetails(null);
        } else {
          const errorMsg = data.error?.message || "Unable to fetch repositories from GitHub.";
          setError(errorMsg);
          setErrorDetails(
            "Live synchronization requires external network connectivity and an optional GITHUB_TOKEN environment variable. You can inspect all repositories directly on the public profile."
          );
          setRepositories([]);
        }
      } catch (err) {
        if (!isSubscribed) return;
        console.error("Failed to fetch GitHub repositories:", err);
        setError("GitHub API is currently unreachable.");
        setErrorDetails(
          "Network connection or GitHub API gateway timeout. Ensure internet access is available and GITHUB_TOKEN is configured in .env."
        );
        setRepositories([]);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadRepositories();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    try {
      const response = await fetch("/api/github/repositories");
      const data = await response.json();
      if (response.ok && data.repositories) {
        setRepositories(data.repositories);
        if (data.username) setUsername(data.username);
      } else {
        setError(data.error?.message || "Unable to fetch repositories from GitHub.");
      }
    } catch {
      setError("GitHub API is currently unreachable.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger repository sync
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch("/api/github/sync", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setSyncStatus(
          `Sync complete: ${data.created ?? 0} added, ${data.updated ?? 0} updated`
        );
        const repoRes = await fetch("/api/github/repositories");
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          if (repoData.repositories) setRepositories(repoData.repositories);
        }
      } else {
        setSyncStatus(data.error?.message || "Sync failed. Check network or rate limits.");
      }
    } catch {
      setSyncStatus("Sync failed: Network unreachable.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  // Extract unique languages from real repositories
  const availableLanguages = Array.from(
    new Set(
      repositories
        .map((r) => r.primaryLanguage)
        .filter((lang): lang is string => Boolean(lang))
    )
  ).sort();

  // Filter repositories
  const filteredRepos = repositories.filter((repo) => {
    const matchesLang =
      selectedLanguage === "all" ||
      repo.primaryLanguage?.toLowerCase() === selectedLanguage.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      repo.name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query)) ||
      repo.topics.some((t) => t.toLowerCase().includes(query));

    return matchesLang && matchesSearch;
  });

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 sm:hidden panel-backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={containerRef}
        className="panel-enter fixed inset-x-0 bottom-0 z-40 sm:inset-x-auto sm:left-[216px] sm:top-4 sm:bottom-4 sm:w-[540px] max-h-[90vh] sm:max-h-none bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-panel)] overflow-hidden flex flex-col select-none"
        role="dialog"
        aria-labelledby="github-panel-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0 bg-[var(--surface)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase">
                04 GITHUB
              </span>
              <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--border-strong)]">
                ·
              </span>
              <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                SOURCE CONTROL REGISTRY
              </span>
            </div>
            <h2
              id="github-panel-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              REPOSITORIES ({repositories.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <SystemButton
              className="px-2.5 py-1 text-[9px]"
              onClick={handleSync}
              disabled={isSyncing}
              aria-label="Synchronize repositories with GitHub"
            >
              {isSyncing ? "SYNCING..." : "SYNC GITHUB"}
            </SystemButton>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              aria-label="Close GitHub panel"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        {/* ── Status Banner (if sync status reported) ─────────────── */}
        {syncStatus && (
          <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-2 font-mono text-[9px] text-[var(--foreground-muted)] uppercase tracking-[0.1em] flex items-center justify-between">
            <span>{syncStatus}</span>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              aria-label="Dismiss status"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Search & Filter Controls ────────────────────────────── */}
        <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 shrink-0 flex flex-col gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH REPOSITORIES OR TOPICS..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] text-[var(--foreground)] placeholder:text-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)] uppercase"
              aria-label="Search repositories or topics"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Language filter pills */}
          {availableLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by language">
              <button
                onClick={() => setSelectedLanguage("all")}
                role="tab"
                aria-selected={selectedLanguage === "all"}
                className={[
                  "font-mono text-[8px] tracking-[0.14em] uppercase px-2 py-1 border transition-colors",
                  selectedLanguage === "all"
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                ALL
              </button>
              {availableLanguages.map((lang) => {
                const isSelected = selectedLanguage.toLowerCase() === lang.toLowerCase();
                return (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    role="tab"
                    aria-selected={isSelected}
                    className={[
                      "font-mono text-[8px] tracking-[0.14em] uppercase px-2 py-1 border transition-colors",
                      isSelected
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
                    ].join(" ")}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Content Area ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Loading state */}
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="status-dot status-dot--pulse" aria-hidden="true" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                  FETCHING GITHUB REPOSITORIES...
                </span>
              </div>
              <p className="font-mono text-[8px] tracking-[0.12em] text-[var(--border-strong)] uppercase">
                QUERYING GITHUB REST ENDPOINT
              </p>
            </div>
          )}

          {/* Diagnostic & Offline Notice (When error occurred or sync blocked) */}
          {!loading && error && (
            <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="status-dot bg-[var(--status-planned)]" aria-hidden="true" />
                <span className="font-mono text-[9px] font-bold tracking-[0.16em] text-[var(--foreground)] uppercase">
                  GITHUB SYNC STATUS
                </span>
              </div>

              <p className="font-mono text-[10px] text-[var(--foreground)] leading-relaxed">
                {error}
              </p>

              {errorDetails && (
                <p className="text-[10px] leading-relaxed text-[var(--foreground-muted)]">
                  {errorDetails}
                </p>
              )}

              <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row gap-2">
                <SystemButton
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => window.open(`https://github.com/${username}`, "_blank")}
                  aria-label="Open public GitHub profile"
                >
                  OPEN GITHUB PROFILE →
                </SystemButton>
                <SystemButton
                  className="w-full sm:w-auto"
                  onClick={handleManualRefresh}
                  aria-label="Retry fetching repositories"
                >
                  RETRY CONNECTION
                </SystemButton>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredRepos.length === 0 && (
            <div className="py-12 text-center">
              <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--border-strong)] uppercase mb-2">
                NO REPOSITORIES FOUND
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLanguage("all");
                  }}
                  className="font-mono text-[9px] tracking-[0.1em] text-[var(--foreground)] underline uppercase"
                >
                  CLEAR SEARCH FILTER
                </button>
              )}
            </div>
          )}

          {/* Repository List */}
          {!loading && !error && filteredRepos.length > 0 && (
            <div className="flex flex-col gap-3">
              {filteredRepos.map((repo, idx) => (
                <div
                  key={repo.externalId || repo.name}
                  className="border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors p-4 flex flex-col gap-2.5"
                >
                  {/* Repo header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[9px] text-[var(--foreground-muted)] tracking-[0.1em] tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] font-bold tracking-[0.1em] text-[var(--foreground)] hover:underline uppercase"
                      >
                        {repo.name} ↗
                      </a>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono text-[9px] text-[var(--foreground-muted)]">
                      {/* Language */}
                      <span className="border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 py-0.5 uppercase tracking-[0.06em]">
                        {repo.primaryLanguage ?? "--"}
                      </span>

                      {/* Stars */}
                      <span className="tabular-nums" title={`${repo.stars} stargazers`}>
                        ★ {repo.stars}
                      </span>

                      {/* Forks */}
                      <span className="tabular-nums" title={`${repo.forks} forks`}>
                        ⑂ {repo.forks}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {repo.description ? (
                    <p className="text-[10px] leading-relaxed text-[var(--foreground-muted)]">
                      {repo.description}
                    </p>
                  ) : (
                    <p className="font-mono text-[9px] text-[var(--border-strong)] uppercase">
                      -- NO DESCRIPTION PROVIDED
                    </p>
                  )}

                  {/* Topics */}
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {repo.topics.map((topic) => (
                        <span
                          key={topic}
                          className="font-mono text-[8px] tracking-[0.04em] text-[var(--foreground-muted)] bg-[var(--surface-muted)] border border-[var(--border-subtle)] px-1.5 py-0.5 lowercase"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between font-mono text-[8px] tracking-[0.12em] text-[var(--border-strong)] uppercase">
                    <span>
                      UPDATED: {new Date(repo.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>

                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--foreground)] hover:underline tracking-[0.14em]"
                    >
                      VIEW SOURCE →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 bg-[var(--surface-muted)] flex items-center justify-between font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
          <span>USER: {username}</span>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--foreground)] hover:underline"
          >
            GITHUB.COM/{username.toUpperCase()} ↗
          </a>
        </div>
      </aside>
    </>
  );
}

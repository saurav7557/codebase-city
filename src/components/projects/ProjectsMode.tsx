"use client";

import { useEffect, useRef, useState } from "react";
import { SystemButton } from "@/components/ui/SystemButton";
import { ArchitecturalImage } from "@/components/ui/ArchitecturalImage";
import { cityData } from "@/data/city";
import type { CityBuilding } from "@/types/city";

// ─────────────────────────────────────────────────────────────────────────────
// ProjectsMode — Full-featured architectural Projects experience (02 PROJECTS)
//
// Displays real projects from the database/API with resilient fallback to
// canonical cityData. Features search, category filters, detailed technical
// specifications, and bidirectional integration with the 3D City canvas.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  githubUrl?: string | null;
  liveUrl?: string | null;
  technologies: string[];
  districtName?: string;
  districtColor?: string;
  buildingId?: string;
  position?: [number, number, number];
  height?: number;
}

interface ProjectsModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding?: (building: CityBuilding) => void;
}

const CATEGORIES = [
  { id: "all", label: "ALL DOMAINS" },
  { id: "backend", label: "BACKEND" },
  { id: "ai", label: "AI / ML" },
  { id: "blockchain", label: "BLOCKCHAIN" },
  { id: "open-source", label: "OPEN SOURCE" },
  { id: "achievement", label: "MILESTONES" },
] as const;

export function ProjectsMode({
  isOpen,
  onClose,
  onSelectBuilding,
}: ProjectsModeProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape closes detail or panel
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeProject) {
          setActiveProject(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeProject, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (!isSubscribed) return;

        if (response.ok) {
          const data = await response.json();
          const rawProjects = Array.isArray(data.projects) ? data.projects : [];

          if (rawProjects.length > 0) {
            interface RawTechItem {
              technology?: { name?: string };
              name?: string;
            }
            interface RawProjectItem {
              id: string;
              name: string;
              slug: string;
              description: string;
              category: string;
              status: string;
              githubUrl?: string | null;
              liveUrl?: string | null;
              technologies?: (RawTechItem | string)[];
              district?: { name?: string; color?: string };
              building?: {
                id: string;
                positionX: number;
                positionY: number;
                positionZ: number;
                height: number;
              };
            }

            const mapped: ProjectItem[] = rawProjects.map((p: RawProjectItem) => {
              const techList: string[] = (p.technologies ?? []).map((t) => {
                if (typeof t === "string") return t;
                return t.technology?.name ?? t.name ?? "";
              }).filter(Boolean);

              return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                category: p.category,
                status: p.status,
                githubUrl: p.githubUrl,
                liveUrl: p.liveUrl,
                technologies: techList,
                districtName: p.district?.name,
                districtColor: p.district?.color,
                buildingId: p.building?.id ?? p.id,
                position: p.building
                  ? [p.building.positionX, p.building.positionY, p.building.positionZ]
                  : undefined,
                height: p.building?.height,
              };
            });

            if (isSubscribed) {
              setProjects(mapped);
              setLoading(false);
            }
            return;
          }
        }
        if (isSubscribed) {
          setProjects(getCanonicalProjects());
          setLoading(false);
        }
      } catch {
        if (isSubscribed) {
          setProjects(getCanonicalProjects());
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.projects) && data.projects.length > 0) {
          interface RawTechItem {
            technology?: { name?: string };
            name?: string;
          }
          interface RawProjectItem {
            id: string;
            name: string;
            slug: string;
            description: string;
            category: string;
            status: string;
            githubUrl?: string | null;
            liveUrl?: string | null;
            technologies?: (RawTechItem | string)[];
            district?: { name?: string; color?: string };
            building?: {
              id: string;
              positionX: number;
              positionY: number;
              positionZ: number;
              height: number;
            };
          }
          const mapped: ProjectItem[] = data.projects.map((p: RawProjectItem) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            category: p.category,
            status: p.status,
            githubUrl: p.githubUrl,
            liveUrl: p.liveUrl,
            technologies: (p.technologies ?? []).map((t) => {
              if (typeof t === "string") return t;
              return t.technology?.name ?? t.name ?? "";
            }).filter(Boolean),
            districtName: p.district?.name,
            districtColor: p.district?.color,
            buildingId: p.building?.id ?? p.id,
            position: p.building
              ? [p.building.positionX, p.building.positionY, p.building.positionZ]
              : undefined,
            height: p.building?.height,
          }));
          setProjects(mapped);
        } else {
          setProjects(getCanonicalProjects());
        }
      })
      .catch(() => {
        setProjects(getCanonicalProjects());
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!isOpen) return null;

  // Filter projects by category and search query
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategory === "all" ||
      project.category.toLowerCase() === selectedCategory.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      project.name.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.technologies.some((t) => t.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const handleLocateInCity = (project: ProjectItem) => {
    if (!onSelectBuilding) return;

    // Find the building in canonical cityData or synthesize from project data
    const matchedBuilding =
      cityData.buildings.find(
        (b) => b.id === project.buildingId || b.id === project.id
      ) ??
      (project.position && project.height
        ? {
            id: project.buildingId ?? project.id,
            name: project.name,
            type: (project.category as CityBuilding["type"]) || "generic",
            district: project.category,
            description: project.description,
            status: (project.status as CityBuilding["status"]) || "active",
            position: project.position,
            height: project.height,
            color: project.districtColor || "#6366f1",
            accentColor: "#a5b4fc",
            technologies: project.technologies,
          }
        : null);

    if (matchedBuilding) {
      onSelectBuilding(matchedBuilding);
      onClose();
    }
  };

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
        aria-labelledby="projects-panel-title"
      >
        {/* Top accent line */}
        <span className="accent-line-top" aria-hidden="true" />

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 shrink-0 bg-[var(--surface)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[8px] tracking-[0.26em] text-[var(--foreground-muted)] uppercase">
                02 PROJECTS
              </span>
              <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--border-strong)]">
                ·
              </span>
              <span className="font-mono text-[8px] tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                ARCHITECTURAL SPECIFICATION
              </span>
            </div>
            <h2
              id="projects-panel-title"
              className="text-sm font-bold tracking-[0.22em] text-[var(--foreground)] uppercase"
            >
              {activeProject ? activeProject.name : "PORTFOLIO PROJECTS"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {activeProject && (
              <SystemButton
                className="px-2.5 py-1 text-[9px]"
                onClick={() => setActiveProject(null)}
                aria-label="Back to projects list"
              >
                ← BACK
              </SystemButton>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              aria-label="Close projects panel"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        {/* ── Search & Filter bar (List View Only) ─────────────────── */}
        {!activeProject && (
          <div className="border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 shrink-0 flex flex-col gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PROJECTS OR TECHNOLOGIES..."
                className="w-full bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] text-[var(--foreground)] placeholder:text-[var(--border-strong)] focus:outline-none focus:border-[var(--accent)] uppercase"
                aria-label="Search projects or technologies"
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

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by domain">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    role="tab"
                    aria-selected={isSelected}
                    className={[
                      "font-mono text-[8px] tracking-[0.14em] uppercase px-2 py-1 border transition-colors",
                      isSelected
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] font-medium"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
                    ].join(" ")}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Scrollable Content Area ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="status-dot status-dot--pulse" aria-hidden="true" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--foreground-muted)] uppercase">
                  INITIALIZING ARCHITECTURAL RECORDS...
                </span>
              </div>
              <p className="font-mono text-[8px] tracking-[0.12em] text-[var(--border-strong)] uppercase">
                QUERYING PROJECT REPOSITORY
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="border border-[var(--status-planned)] bg-[var(--surface-muted)] p-4 text-center">
              <p className="font-mono text-[10px] tracking-[0.12em] text-[var(--status-planned)] uppercase mb-2">
                {error}
              </p>
              <SystemButton className="px-3 py-1.5 text-[9px]" onClick={handleRetry}>
                RETRY QUERY
              </SystemButton>
            </div>
          )}

          {/* ── EXPANDED DETAIL VIEW ──────────────────────────────── */}
          {!loading && !error && activeProject && (
            <div className="flex flex-col gap-5">
              {/* Top metadata strip */}
              <div className="border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase">
                    SYSTEM DOSSIER · {activeProject.slug.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={[
                        "status-dot",
                        activeProject.status === "active"
                          ? "status-dot--active"
                          : activeProject.status === "building"
                          ? "status-dot--building"
                          : "status-dot--planned",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground)] uppercase font-medium">
                      {activeProject.status === "active"
                        ? "OPERATIONAL"
                        : activeProject.status === "building"
                        ? "UNDER CONSTRUCTION"
                        : "PLANNED"}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold tracking-[0.12em] text-[var(--foreground)] uppercase mb-2">
                  {activeProject.name}
                </h3>
                <p className="text-[11px] leading-relaxed text-[var(--foreground-muted)]">
                  {activeProject.description}
                </p>
              </div>

              {/* Interface Capture Artifact / Schematic Preview */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2">
                  INTERFACE ARTIFACT / CAPTURE
                </h4>
                <ArchitecturalImage
                  src={`/images/projects/${activeProject.slug}.png`}
                  alt={`${activeProject.name} Interface`}
                  type="project"
                  caption={activeProject.name}
                  expectedPath={`public/images/projects/${activeProject.slug}.png`}
                  aspectRatio="16/9"
                />
              </div>

              {/* Technical Specifications Table */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2.5">
                  ARCHITECTURAL PARAMETERS
                </h4>
                <div className="border border-[var(--border)] divide-y divide-[var(--border)] font-mono text-[9px]">
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      DOMAIN CLASSIFICATION
                    </span>
                    <span className="font-semibold text-[var(--foreground)] uppercase tracking-[0.1em]">
                      {activeProject.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-muted)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      CITY DISTRICT
                    </span>
                    <span className="text-[var(--foreground)] uppercase tracking-[0.1em]">
                      {activeProject.districtName ?? activeProject.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      3D BLUEPRINT GRID [X, Y, Z]
                    </span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      {activeProject.position
                        ? `[${activeProject.position.join(", ")}]`
                        : "COORDINATES CALCULATED IN ENGINE"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--surface-muted)]">
                    <span className="text-[var(--foreground-muted)] uppercase tracking-[0.12em]">
                      BUILDING ELEVATION
                    </span>
                    <span className="text-[var(--foreground)] tabular-nums">
                      {activeProject.height ? `${activeProject.height} UNITS` : "BASELINE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2.5">
                  TECHNOLOGY STACK
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 font-mono text-[9px] tracking-[0.1em] text-[var(--foreground)] uppercase"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* External Resources */}
              <div>
                <h4 className="font-mono text-[9px] tracking-[0.22em] text-[var(--foreground-muted)] uppercase mb-2.5">
                  CONNECTED ARTIFACTS
                </h4>
                <div className="flex flex-col gap-2">
                  {activeProject.githubUrl ? (
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[10px] font-mono text-[var(--foreground)] hover:border-[var(--border-strong)] transition-colors"
                    >
                      <span className="tracking-[0.12em] uppercase">
                        GITHUB REPOSITORY →
                      </span>
                      <span className="text-[var(--foreground-muted)] text-[9px]">
                        {activeProject.githubUrl.replace("https://github.com/", "")}
                      </span>
                    </a>
                  ) : (
                    <div className="border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-[9px] text-[var(--border-strong)] uppercase">
                      -- NO EXTERNAL REPOSITORY URL LINKED
                    </div>
                  )}

                  {activeProject.liveUrl ? (
                    <a
                      href={activeProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[10px] font-mono text-[var(--foreground)] hover:border-[var(--border-strong)] transition-colors"
                    >
                      <span className="tracking-[0.12em] uppercase">
                        LIVE DEPLOYMENT →
                      </span>
                      <span className="text-[var(--foreground-muted)] text-[9px]">
                        OPEN ENVIRONMENT
                      </span>
                    </a>
                  ) : (
                    <div className="border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-[9px] text-[var(--border-strong)] uppercase">
                      -- NO LIVE DEMO DEPLOYMENT REGISTERED
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
                {onSelectBuilding && (
                  <SystemButton
                    variant="primary"
                    className="w-full"
                    onClick={() => handleLocateInCity(activeProject)}
                    aria-label={`Locate ${activeProject.name} in 3D City`}
                  >
                    LOCATE IN 3D CITY
                  </SystemButton>
                )}
                <SystemButton
                  className="w-full"
                  onClick={() => setActiveProject(null)}
                  aria-label="Return to all projects list"
                >
                  RETURN TO PROJECT LIST
                </SystemButton>
              </div>
            </div>
          )}

          {/* ── PROJECT LIST VIEW ─────────────────────────────────── */}
          {!loading && !error && !activeProject && (
            <div>
              {filteredProjects.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-[var(--border-strong)] uppercase mb-2">
                    NO PROJECTS MATCH CURRENT SPECIFICATION
                  </p>
                  {(searchQuery || selectedCategory !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                      className="font-mono text-[9px] tracking-[0.1em] text-[var(--foreground)] underline uppercase"
                    >
                      RESET FILTERS
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredProjects.map((project, idx) => (
                    <div
                      key={project.id}
                      className="border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-colors p-4 flex flex-col gap-2.5"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[var(--foreground-muted)] tracking-[0.1em] tabular-nums">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-[8px] text-[var(--border-strong)]">
                            ·
                          </span>
                          <h3 className="font-mono text-[11px] font-bold tracking-[0.12em] text-[var(--foreground)] uppercase">
                            {project.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={[
                              "status-dot",
                              project.status === "active"
                                ? "status-dot--active"
                                : project.status === "building"
                                ? "status-dot--building"
                                : "status-dot--planned",
                            ].join(" ")}
                            aria-hidden="true"
                          />
                          <span className="font-mono text-[8px] tracking-[0.1em] text-[var(--foreground-muted)] uppercase">
                            {project.status === "active"
                              ? "OPERATIONAL"
                              : project.status === "building"
                              ? "CONSTRUCTION"
                              : "PLANNED"}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[10px] leading-relaxed text-[var(--foreground-muted)] line-clamp-2">
                        {project.description}
                      </p>

                      {/* Technology Chips */}
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="border border-[var(--border-subtle)] bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[8px] tracking-[0.06em] text-[var(--foreground-muted)] uppercase"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 4 && (
                          <span className="font-mono text-[8px] tracking-[0.06em] text-[var(--border-strong)] self-center px-1">
                            +{project.technologies.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
                          {project.districtName ?? project.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveProject(project)}
                            className="font-mono text-[9px] tracking-[0.14em] text-[var(--foreground)] hover:underline uppercase font-medium"
                            aria-label={`Inspect specification for ${project.name}`}
                          >
                            INSPECT DOSSIER →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="border-t border-[var(--border)] px-5 py-3 shrink-0 bg-[var(--surface-muted)] flex items-center justify-between font-mono text-[8px] tracking-[0.14em] text-[var(--foreground-muted)] uppercase">
          <span>TOTAL UNITS: {projects.length}</span>
          <span>CODEBASE CITY REGISTRY</span>
        </div>
      </aside>
    </>
  );
}

// Canonical static project list mapped from cityData (deterministic fallback)
function getCanonicalProjects(): ProjectItem[] {
  return cityData.buildings.map((building) => {
    const district = cityData.districts.find((d) => d.id === building.district);
    return {
      id: building.id,
      name: building.name,
      slug: building.id,
      description: building.description,
      category: building.type,
      status: building.status,
      githubUrl:
        building.id === "saurav-hq"
          ? "https://github.com/saurav7557"
          : null,
      liveUrl: null,
      technologies: building.technologies ?? [],
      districtName: district?.name ?? building.district,
      districtColor: district?.color ?? building.color,
      buildingId: building.id,
      position: building.position,
      height: building.height,
    };
  });
}
